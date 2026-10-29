package com.glydecurtains.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.glydecurtains.entity.Category;
import com.glydecurtains.entity.Product;
import com.glydecurtains.entity.ProductSpecification;
import com.glydecurtains.entity.ProductVariant;
import com.glydecurtains.entity.SubCategory;
import com.glydecurtains.exception.BusinessException;
import com.glydecurtains.repository.CategoryRepository;
import com.glydecurtains.repository.ProductRepository;
import com.glydecurtains.repository.SubCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import org.xhtmlrenderer.pdf.ITextRenderer;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Request-for-quotation sheet for suppliers: the chosen products with every specification row
 * (also the ones hidden from customers) and empty "Your rate" and "Remarks" columns for the
 * supplier to fill in. Customer prices are left out unless the shop asks for them.
 */
@Service
@RequiredArgsConstructor
public class SupplierQuoteService {

    static final String SHOP = "Glyde Curtain Track & Accessories";
    static final String SHOP_CONTACT = "Pune | +91 81490 66661 | vishalsjain89@gmail.com";
    private static final ObjectMapper JSON = new ObjectMapper();

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final SubCategoryRepository subCategoryRepository;
    private final TemplateEngine templateEngine;

    public record Spec(String name, String value) {}

    /** One product line of the sheet. */
    public record Line(
            int number,
            String code,
            String name,
            String category,
            List<String> sizes,
            List<String> colours,
            List<Spec> specs,
            String ourPrice) {

        public String optionsText() {
            List<String> parts = new ArrayList<>();
            if (!sizes.isEmpty()) parts.add("Sizes: " + String.join(", ", sizes));
            if (!colours.isEmpty()) parts.add("Colours: " + String.join(", ", colours));
            return String.join("; ", parts);
        }
    }

    @Transactional(readOnly = true)
    public List<Line> lines(List<Long> productIds, boolean includePrices) {
        if (productIds == null || productIds.isEmpty()) {
            throw new BusinessException("Choose at least one product", "NO_PRODUCTS", HttpStatus.BAD_REQUEST);
        }
        Map<Long, Category> categories = categoryRepository.findAll().stream()
                .collect(Collectors.toMap(Category::getId, Function.identity()));
        Map<Long, String> subCategories = subCategoryRepository.findAll().stream()
                .collect(Collectors.toMap(SubCategory::getId, SubCategory::getName));

        List<Product> products = new ArrayList<>(productRepository.findAllById(productIds));
        products.sort(Comparator
                .comparing((Product p) -> {
                    Category c = categories.get(p.getCategoryId());
                    return c == null || c.getSortOrder() == null ? Integer.MAX_VALUE : c.getSortOrder();
                })
                .thenComparing(p -> categoryName(p, categories, subCategories))
                .thenComparing(Product::getName, Comparator.nullsLast(Comparator.naturalOrder())));

        List<Line> lines = new ArrayList<>();
        for (Product p : products) {
            List<ProductVariant> variants = p.getVariants() == null ? List.of() : p.getVariants();
            List<Spec> specs = (p.getSpecifications() == null ? List.<ProductSpecification>of() : p.getSpecifications()).stream()
                    .sorted(Comparator.comparing(ProductSpecification::getSortOrder, Comparator.nullsLast(Comparator.naturalOrder())))
                    .map(s -> new Spec(s.getSpecKey(), s.getSpecValue()))
                    .toList();
            String name = p.getInternalName() != null && !p.getInternalName().isBlank()
                    ? p.getName() + " (" + p.getInternalName().trim() + ")"
                    : p.getName();
            lines.add(new Line(
                    lines.size() + 1,
                    Objects.toString(p.getSku(), ""),
                    name,
                    categoryName(p, categories, subCategories),
                    distinct(variants.stream().map(ProductVariant::getSize).toList(), p.getSizes()),
                    distinct(variants.stream().map(ProductVariant::getColor).toList(), p.getColors()),
                    specs,
                    includePrices ? priceText(p, variants) : null));
        }
        return lines;
    }

    // ─── CSV ─────────────────────────────────────────────────────────────────

    /**
     * One row per product and one column per specification name, so the sheet opens straight
     * into Excel or Google Sheets. Starts with a byte-order mark so Excel reads it as UTF-8.
     */
    public byte[] csv(List<Long> productIds, boolean includePrices) {
        List<Line> lines = lines(productIds, includePrices);
        LinkedHashSet<String> specNames = new LinkedHashSet<>();
        lines.forEach(l -> l.specs().forEach(s -> specNames.add(s.name())));

        List<String> header = new ArrayList<>(List.of("No.", "Code", "Product", "Category", "Sizes", "Colours"));
        header.addAll(specNames);
        if (includePrices) header.add("Our price");
        header.addAll(List.of("Your rate (Rs.)", "Rate per (piece / metre / set)", "Remarks"));

        StringBuilder out = new StringBuilder("﻿");
        appendRow(out, header);
        for (Line l : lines) {
            List<String> row = new ArrayList<>(List.of(String.valueOf(l.number()), l.code(), l.name(), l.category(),
                    String.join(", ", l.sizes()), String.join(", ", l.colours())));
            for (String spec : specNames) {
                row.add(l.specs().stream().filter(s -> s.name().equals(spec)).map(Spec::value)
                        .collect(Collectors.joining(" / ")));
            }
            if (includePrices) row.add(Objects.toString(l.ourPrice(), ""));
            row.addAll(List.of("", "", ""));
            appendRow(out, row);
        }
        return out.toString().getBytes(StandardCharsets.UTF_8);
    }

    private static void appendRow(StringBuilder out, List<String> cells) {
        out.append(cells.stream().map(SupplierQuoteService::csvCell).collect(Collectors.joining(","))).append("\r\n");
    }

    static String csvCell(String value) {
        String v = value == null ? "" : value.replace("\r", " ").replace("\n", " ");
        // A leading = + - @ makes spreadsheets run the cell as a formula.
        if (!v.isEmpty() && "=+-@".indexOf(v.charAt(0)) >= 0) v = "'" + v;
        return "\"" + v.replace("\"", "\"\"") + "\"";
    }

    // ─── PDF ─────────────────────────────────────────────────────────────────

    public byte[] pdf(List<Long> productIds, boolean includePrices, String supplierName, String note) {
        List<Line> lines = lines(productIds, includePrices);
        Context context = new Context();
        context.setVariable("shop", SHOP);
        context.setVariable("shopContact", SHOP_CONTACT);
        context.setVariable("date", LocalDate.now().format(DateTimeFormatter.ofPattern("d MMM yyyy")));
        context.setVariable("supplierName", blankToNull(supplierName));
        context.setVariable("note", blankToNull(note));
        context.setVariable("lines", lines);
        context.setVariable("includePrices", includePrices);
        String html = templateEngine.process("supplier-quote", context);
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            ITextRenderer renderer = new ITextRenderer();
            renderer.setDocumentFromString(html);
            renderer.layout();
            renderer.createPDF(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new BusinessException("Could not create the quotation PDF: " + e.getMessage());
        }
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private static String categoryName(Product p, Map<Long, Category> categories, Map<Long, String> subCategories) {
        Category c = categories.get(p.getCategoryId());
        String sub = p.getSubCategoryId() != null ? subCategories.get(p.getSubCategoryId()) : null;
        return Stream.of(c != null ? c.getName() : null, sub).filter(Objects::nonNull).collect(Collectors.joining(" > "));
    }

    private static String priceText(Product p, List<ProductVariant> variants) {
        List<BigDecimal> prices = variants.stream().map(ProductVariant::getPrice)
                .filter(x -> x != null && x.signum() > 0).sorted().toList();
        if (prices.isEmpty()) {
            BigDecimal price = p.getOfferPrice() != null && p.getOfferPrice().signum() > 0 ? p.getOfferPrice() : p.getBasePrice();
            return price != null && price.signum() > 0 ? rupees(price) : "On request";
        }
        BigDecimal min = prices.get(0), max = prices.get(prices.size() - 1);
        return max.compareTo(min) > 0 ? rupees(min) + " to " + rupees(max) : rupees(min);
    }

    private static String rupees(BigDecimal value) {
        return "Rs. " + value.setScale(0, RoundingMode.HALF_UP).toPlainString();
    }

    private static List<String> distinct(List<String> fromVariants, String json) {
        Set<String> values = new LinkedHashSet<>();
        fromVariants.stream().filter(v -> v != null && !v.isBlank()).map(String::trim).forEach(values::add);
        if (json != null && !json.isBlank()) {
            try {
                JSON.readValue(json, new TypeReference<List<String>>() {}).stream()
                        .filter(v -> v != null && !v.isBlank()).map(String::trim).forEach(values::add);
            } catch (Exception ignored) {
                // Not a JSON list: leave the options out.
            }
        }
        return new ArrayList<>(values);
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
