package com.glydecurtains.service;

import com.glydecurtains.entity.Category;
import com.glydecurtains.entity.Product;
import com.glydecurtains.entity.ProductImage;
import com.glydecurtains.entity.ProductVariant;
import com.glydecurtains.entity.SubCategory;
import com.glydecurtains.entity.enums.MediaType;
import com.glydecurtains.entity.enums.ProductStatus;
import com.glydecurtains.repository.CategoryRepository;
import com.glydecurtains.repository.ProductImageRepository;
import com.glydecurtains.repository.ProductRepository;
import com.glydecurtains.repository.SiteSettingsRepository;
import com.glydecurtains.repository.SubCategoryRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.UriUtils;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import org.xhtmlrenderer.pdf.ITextRenderer;

import javax.imageio.ImageIO;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * The product catalogue in two shareable forms:
 * <ul>
 *   <li>a CSV product feed in Meta's format, which Commerce Manager reads on a schedule to fill
 *       the WhatsApp Business catalogue (and Facebook/Instagram shops);</li>
 *   <li>a PDF catalogue to send in any WhatsApp chat, with a tap-to-order link on every product.</li>
 * </ul>
 * Both list every active product, products with photos first, in category order.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CatalogueService {

    static final String DEFAULT_PHONE = "+91 81490 66661";
    private static final String BRAND = "Glyde";
    /** Seed data used 1x1 placeholder JPEGs stored as short base64 strings; they are not photos. */
    private static final int MIN_REAL_IMAGE_LENGTH = 1000;
    private static final int PDF_IMAGE_SIZE = 480;
    /** Photo box on each PDF card, in mm. The PDF renderer ignores max-width, so sizes are set exactly. */
    private static final double PHOTO_BOX_W = 78, PHOTO_BOX_H = 48;
    private static final ObjectMapper JSON = new ObjectMapper();

    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final CategoryRepository categoryRepository;
    private final SubCategoryRepository subCategoryRepository;
    private final SiteSettingsRepository siteSettingsRepository;
    private final TemplateEngine templateEngine;

    /** One product as both outputs need it. */
    public record CatalogueItem(
            Product product,
            String categoryName,
            String subCategoryName,
            ProductImage photo,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            List<String> sizes,
            List<String> colors) {

        public String priceText() {
            if (minPrice == null) return "Price on request";
            String from = rupees(minPrice);
            return maxPrice != null && maxPrice.compareTo(minPrice) > 0 ? from + " to " + rupees(maxPrice) : from;
        }
    }

    // ─── Products ────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<CatalogueItem> items() {
        Map<Long, Category> categories = categoryRepository.findAll().stream()
                .collect(Collectors.toMap(Category::getId, Function.identity()));
        Map<Long, String> subCategories = subCategoryRepository.findAll().stream()
                .collect(Collectors.toMap(SubCategory::getId, SubCategory::getName));

        List<CatalogueItem> items = new ArrayList<>();
        for (Product product : productRepository.findByStatus(ProductStatus.ACTIVE)) {
            Category category = categories.get(product.getCategoryId());
            List<ProductVariant> variants = product.getVariants() == null ? List.of() : product.getVariants();
            List<BigDecimal> prices = variants.stream()
                    .map(ProductVariant::getPrice)
                    .filter(p -> p != null && p.signum() > 0)
                    .sorted()
                    .toList();
            BigDecimal min = prices.isEmpty() ? productPrice(product) : prices.get(0);
            BigDecimal max = prices.isEmpty() ? min : prices.get(prices.size() - 1);
            items.add(new CatalogueItem(
                    product,
                    category != null ? category.getName() : "Other",
                    product.getSubCategoryId() != null ? subCategories.get(product.getSubCategoryId()) : null,
                    photoOf(product).orElse(null),
                    min,
                    max,
                    distinct(variants.stream().map(ProductVariant::getSize).toList(), product.getSizes()),
                    distinct(variants.stream().map(ProductVariant::getColor).toList(), product.getColors())));
        }

        Map<String, Integer> categoryOrder = categories.values().stream()
                .collect(Collectors.toMap(Category::getName, c -> c.getSortOrder() == null ? 0 : c.getSortOrder(), (a, b) -> a));
        // Categories with real photos come first, and within a category, products with photos first.
        Set<String> withPhotos = items.stream().filter(i -> i.photo() != null)
                .map(CatalogueItem::categoryName).collect(Collectors.toSet());
        items.sort(Comparator
                .comparing((CatalogueItem i) -> !withPhotos.contains(i.categoryName()))
                .thenComparing(i -> categoryOrder.getOrDefault(i.categoryName(), Integer.MAX_VALUE))
                .thenComparing(CatalogueItem::categoryName)
                .thenComparing(i -> i.photo() == null)
                .thenComparing(i -> Objects.toString(i.subCategoryName(), ""))
                .thenComparing(i -> i.product().getName()));
        return items;
    }

    private static BigDecimal productPrice(Product product) {
        BigDecimal price = product.getOfferPrice() != null && product.getOfferPrice().signum() > 0
                ? product.getOfferPrice() : product.getBasePrice();
        return price != null && price.signum() > 0 ? price : null;
    }

    /** Variant values plus the product's own list, which is stored as JSON text such as ["L","XL"]. */
    private static List<String> distinct(List<String> fromVariants, String productJson) {
        List<String> all = new ArrayList<>(fromVariants);
        if (productJson != null && !productJson.isBlank()) {
            try {
                all.addAll(JSON.readValue(productJson, new TypeReference<List<String>>() { }));
            } catch (IOException e) {
                all.add(productJson);
            }
        }
        return all.stream().filter(Objects::nonNull).map(String::trim).filter(s -> !s.isEmpty()).distinct().toList();
    }

    private Optional<ProductImage> photoOf(Product product) {
        return productImageRepository.findByProductIdOrderBySortOrderAsc(product.getId()).stream()
                .filter(img -> img.getMediaType() == null || img.getMediaType() == MediaType.IMAGE)
                .filter(img -> isRealPhoto(img.getBase64Data()))
                .min(Comparator.comparing((ProductImage img) -> !Boolean.TRUE.equals(img.getIsThumbnail())));
    }

    private static boolean isRealPhoto(String data) {
        if (data == null) return false;
        if (data.startsWith("/")) return !data.contains("/placeholder/");
        return data.length() >= MIN_REAL_IMAGE_LENGTH;
    }

    /** Raw bytes of a product photo, whether it is a bundled file or an uploaded one. */
    @Transactional(readOnly = true)
    public Optional<byte[]> imageBytes(Long imageId) {
        return productImageRepository.findById(imageId)
                .filter(img -> img.getMediaType() == null || img.getMediaType() == MediaType.IMAGE)
                .flatMap(img -> readImage(img.getBase64Data()));
    }

    private Optional<byte[]> readImage(String data) {
        if (data == null || data.isBlank()) return Optional.empty();
        try {
            if (data.startsWith("/")) {
                // Bundled photos are stored as URL paths, e.g. /products/accessories/20%23Ceiling/a.jpg
                ClassPathResource resource = new ClassPathResource("static" + UriUtils.decode(data, StandardCharsets.UTF_8));
                if (!resource.exists()) return Optional.empty();
                try (InputStream in = resource.getInputStream()) {
                    return Optional.of(in.readAllBytes());
                }
            }
            String base64 = data.startsWith("data:") ? data.substring(data.indexOf(',') + 1) : data;
            return Optional.of(Base64.getDecoder().decode(base64.trim()));
        } catch (IOException | IllegalArgumentException e) {
            log.warn("Could not read catalogue image: {}", e.getMessage());
            return Optional.empty();
        }
    }

    // ─── Meta / WhatsApp Business feed ───────────────────────────────────────

    /**
     * CSV in Meta's catalogue data-feed format. Products without a price are left out, because
     * Meta rejects items with no price; they show up once a price is set in the admin panel.
     *
     * @param storefrontUrl e.g. https://glydecurtains.com
     * @param apiUrl        public base of this backend, e.g. https://glydecurtains-backend.onrender.com
     */
    public String metaFeedCsv(String storefrontUrl, String apiUrl) {
        StringBuilder csv = new StringBuilder(
                "id,title,description,availability,condition,price,link,image_link,brand,product_type\n");
        for (CatalogueItem item : items()) {
            if (item.minPrice() == null || item.photo() == null) continue;
            Product p = item.product();
            csv.append(String.join(",",
                    cell(p.getSku()),
                    cell(p.getName()),
                    cell(feedDescription(item)),
                    "in stock",
                    "new",
                    cell(item.minPrice().setScale(2, RoundingMode.HALF_UP).toPlainString() + " INR"),
                    cell(storefrontUrl + "/products/" + p.getId()),
                    cell(apiUrl + "/api/catalogue/images/" + item.photo().getId() + ".jpg"),
                    BRAND,
                    cell(item.subCategoryName() != null ? item.categoryName() + " > " + item.subCategoryName() : item.categoryName())))
                    .append('\n');
        }
        return csv.toString();
    }

    private static String feedDescription(CatalogueItem item) {
        Product p = item.product();
        List<String> parts = new ArrayList<>();
        String text = firstNonBlank(p.getShortDescription(), p.getLongDescription(), p.getName());
        parts.add(text.replaceAll("<[^>]+>", " ").replaceAll("\\s+", " ").trim());
        if (!item.sizes().isEmpty()) parts.add("Sizes: " + String.join(", ", item.sizes()) + ".");
        if (!item.colors().isEmpty()) parts.add("Colours: " + String.join(", ", item.colors()) + ".");
        if (item.maxPrice() != null && item.maxPrice().compareTo(item.minPrice()) > 0) {
            parts.add("Price depends on size: " + item.priceText() + ".");
        }
        return String.join(" ", parts);
    }

    private static String cell(String value) {
        String v = value == null ? "" : value.replace("\r", " ").replace("\n", " ");
        return "\"" + v.replace("\"", "\"\"") + "\"";
    }

    // ─── PDF catalogue ───────────────────────────────────────────────────────

    public byte[] cataloguePdf(String storefrontUrl) {
        String phone = siteSettingsRepository.findAll().stream()
                .map(s -> s.getContactPhone())
                .filter(s -> s != null && s.replaceAll("\\D", "").length() >= 10)
                .findFirst()
                .orElse(DEFAULT_PHONE);
        String digits = phone.replaceAll("\\D", "");
        String whatsappNumber = digits.length() == 10 ? "91" + digits : digits;

        Map<String, List<Map<String, Object>>> sections = new LinkedHashMap<>();
        for (CatalogueItem item : items()) {
            Product p = item.product();
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("name", p.getName());
            row.put("code", p.getSku());
            row.put("group", item.subCategoryName());
            row.put("price", item.priceText());
            row.put("sizes", String.join(", ", item.sizes()));
            row.put("colors", String.join(", ", item.colors()));
            PdfImage image = item.photo() == null ? null : pdfImage(item.photo());
            if (image == null) image = placeholderImage();
            putImage(row, image);
            row.put("pageUrl", storefrontUrl + "/products/" + p.getId());
            String message = "Hi Glyde, I saw this in your catalogue:\nProduct: " + p.getName()
                    + "\nCode: " + p.getSku() + "\n" + storefrontUrl + "/products/" + p.getId();
            row.put("whatsappUrl", "https://wa.me/" + whatsappNumber + "?text="
                    + URLEncoder.encode(message, StandardCharsets.UTF_8).replace("+", "%20"));
            sections.computeIfAbsent(item.categoryName(), k -> new ArrayList<>()).add(row);
        }

        Context context = new Context(Locale.ENGLISH);
        context.setVariable("sections", sections);
        context.setVariable("phone", phone);
        context.setVariable("whatsappUrl", "https://wa.me/" + whatsappNumber);
        context.setVariable("siteUrl", storefrontUrl);
        context.setVariable("siteHost", storefrontUrl.replaceFirst("^https?://", ""));
        PdfImage logo = imageDataUri(readImage("/assets/logo/logo.jpg").orElse(null), 900);
        context.setVariable("logo", logo == null ? null : logo.uri());
        context.setVariable("date", LocalDate.now().format(DateTimeFormatter.ofPattern("MMMM yyyy", Locale.ENGLISH)));
        String html = templateEngine.process("catalogue", context);

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            ITextRenderer renderer = new ITextRenderer();
            renderer.setDocumentFromString(html);
            renderer.layout();
            renderer.createPDF(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new IllegalStateException("Could not build the catalogue PDF", e);
        }
    }

    /** A resized photo as a data URI, with its pixel size so the template can scale it into the box. */
    record PdfImage(String uri, int width, int height) {
    }

    private PdfImage pdfImage(ProductImage photo) {
        return imageDataUri(readImage(photo.getBase64Data()).orElse(null), PDF_IMAGE_SIZE);
    }

    private PdfImage placeholderImage() {
        return imageDataUri(readImage("/products/accessories/placeholder/photo-coming-soon.jpg").orElse(null), PDF_IMAGE_SIZE);
    }

    private static void putImage(Map<String, Object> row, PdfImage image) {
        if (image == null) return;
        double scale = Math.min(PHOTO_BOX_W / image.width(), PHOTO_BOX_H / image.height());
        row.put("image", image.uri());
        row.put("imageStyle", String.format(Locale.ROOT, "width: %.1fmm; height: %.1fmm; margin-top: %.1fmm;",
                image.width() * scale, image.height() * scale, 1 + (PHOTO_BOX_H - image.height() * scale) / 2));
    }

    /** Shrinks a photo to fit maxSize px and returns it as a JPEG data URI, so the PDF stays small. */
    static PdfImage imageDataUri(byte[] bytes, int maxSize) {
        if (bytes == null) return null;
        try {
            BufferedImage source = ImageIO.read(new ByteArrayInputStream(bytes));
            if (source == null) return null;
            double scale = Math.min(1.0, (double) maxSize / Math.max(source.getWidth(), source.getHeight()));
            int w = Math.max(1, (int) Math.round(source.getWidth() * scale));
            int h = Math.max(1, (int) Math.round(source.getHeight() * scale));
            BufferedImage scaled = new BufferedImage(w, h, BufferedImage.TYPE_INT_RGB);
            Graphics2D g = scaled.createGraphics();
            g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
            g.setColor(java.awt.Color.WHITE);
            g.fillRect(0, 0, w, h);
            g.drawImage(source, 0, 0, w, h, null);
            g.dispose();
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            ImageIO.write(scaled, "jpg", out);
            return new PdfImage("data:image/jpeg;base64," + Base64.getEncoder().encodeToString(out.toByteArray()), w, h);
        } catch (IOException e) {
            return null;
        }
    }

    private static String rupees(BigDecimal amount) {
        NumberFormat format = NumberFormat.getIntegerInstance(new Locale("en", "IN"));
        return "Rs. " + format.format(amount.setScale(0, RoundingMode.HALF_UP));
    }

    private static String firstNonBlank(String... values) {
        for (String v : values) {
            if (v != null && !v.isBlank()) return v;
        }
        return "";
    }
}
