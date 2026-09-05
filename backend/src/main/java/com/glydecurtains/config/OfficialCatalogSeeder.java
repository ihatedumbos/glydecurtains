package com.glydecurtains.config;

import com.glydecurtains.entity.Category;
import com.glydecurtains.entity.Product;
import com.glydecurtains.entity.ProductImage;
import com.glydecurtains.entity.enums.MediaType;
import com.glydecurtains.entity.enums.ProductStatus;
import com.glydecurtains.repository.CategoryRepository;
import com.glydecurtains.repository.ProductImageRepository;
import com.glydecurtains.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.UriUtils;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.Base64;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Imports the products currently published at glydecurtains.com/products.
 * This runner is deliberately idempotent so it also enriches existing local databases.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class OfficialCatalogSeeder implements ApplicationRunner {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;

    @Override
    @Transactional
    public void run(org.springframework.boot.ApplicationArguments args) {
        Category tracks = category("Tracks", "Smooth-glide curtain track systems", 3);
        Category accessories = category("Accessories", "Essential curtain accessories and hardware", 4);
        Category rings = category("Curtain Rings", "Premium curtain rings", 6);
        Category tapes = category("Curtain Tapes", "Curtain tapes and heading accessories", 7);

        Product jumboRunner = product("Jumbo Runner", "GLYDE-RUNNER-J", accessories,
                "Premium aluminium curtain track with smooth glide performance suitable for residential and commercial projects.", true, true);
        addBundledImage(jumboRunner, "catalog/jumbo-runner.jpg", "jumbo-runner.jpg");
        bundledProduct(jumboRunner, "JumboRunner", List.of(
                "Runner-H.png.jpg", "IMG_20260624_143015.jpg", "IMG_20260624_143046.jpg",
                "video_20260624_142018 (online-video-cutter.com) (1).mp4", "video_20260624_143027.mp4"));

        product("E102 White", "GLYDE-E102-WHITE", tracks,
                "Heavy duty aluminium curtain track designed for long life and silent operation.", true, false);
        product("R201 Round Curtain Ring", "GLYDE-R201", rings,
                "Premium quality curtain rings with smooth movement and elegant finish.", false, true);
        product("T301 Curtain Tape", "GLYDE-T301", tapes,
                "High quality curtain tape suitable for pencil pleat curtains.", false, false);

        bundledProduct("Accessories Collection", "GLYDE-ACC-COLLECTION", accessories, "", List.of(
                "IMG_20260624_140901.jpg", "IMG_20260624_141128.jpg", "IMG_20260624_144132.jpg", "VID-20260624-WA0013.mp4"));
        bundledProduct("20# Ceiling", "GLYDE-ACC-20-CEILING", accessories, "20#Ceiling", List.of(
                "IMG_20260624_143604.jpg", "IMG_20260624_143610.jpg", "video_20260624_142018 (online-video-cutter.com).mp4", "video_20260624_143618.mp4"));
        bundledProduct("20# End Cap", "GLYDE-ACC-20-ENDCAP", accessories, "20#EndCap", List.of(
                "IMG_20260624_143937.jpg", "IMG_20260624_143956.jpg", "video_20260624_142018 (online-video-cutter.com).mp4", "video_20260624_144001.mp4"));
        bundledProduct("20# Wall", "GLYDE-ACC-20-WALL", accessories, "20#Wall", List.of(
                "IMG_20260624_143346.jpg", "IMG_20260624_143403.jpg", "video_20260624_142018 (online-video-cutter.com).mp4", "video_20260624_143352.mp4"));
        bundledProduct("23# End Cap", "GLYDE-ACC-23-ENDCAP", accessories, "23#EndCap", List.of("endcap.png"));
        bundledProduct("23# Wall", "GLYDE-ACC-23-WALL", accessories, "23#wall", List.of(
                "Photoroom-20250111_130630_wm.png.jpg", "IMG_20260624_142149.jpg", "IMG_20260624_142437.jpg",
                "video_20260624_142018 (online-video-cutter.com).mp4", "video_20260624_142159.mp4"));
        bundledProduct("Bicho Ceiling", "GLYDE-ACC-BICHO-CEILING", accessories, "BichoCeiling", List.of(
                "IMG_20260624_142338.jpg", "IMG_20260624_142423.jpg", "video_20260624_142018 (online-video-cutter.com).mp4", "video_20260624_142402.mp4"));
        bundledProduct("Ceiling", "GLYDE-ACC-CEILING", accessories, "Ceiling", List.of(
                "ceiling.png", "IMG_20260624_142734.jpg", "IMG_20260624_142811.jpg", "video_20260624_142018 (online-video-cutter.com).mp4", "video_20260624_142749.mp4"));
        bundledProduct("Double Ceiling", "GLYDE-ACC-DOUBLE-CEILING", accessories, "DoubleCeiling", List.of(
                "23# Double Ceiling.jpg", "23# Double Ceiling1.jpg", "micro_movie_20260624_141918.mp4", "video_20260624_142018 (online-video-cutter.com).mp4"));
        bundledProduct("Double Wall", "GLYDE-ACC-DOUBLE-WALL", accessories, "Doublewall", List.of(
                "WallBracketDouble.png.jpg", "IMG_20260624_141943.jpg", "IMG_20260624_142502.jpg", "video_20260624_142018 (online-video-cutter.com).mp4"));
        bundledProduct("Ripple Runner", "GLYDE-ACC-RIPPLE-RUNNER", accessories, "Ripple Runner", List.of(
                "IMG_20260624_144231.jpg", "video_20260624_142018 (online-video-cutter.com).mp4", "video_20260624_144241.mp4", "video_20260624_144257.mp4"));
        bundledProduct("Ripple Tape", "GLYDE-ACC-RIPPLE-TAPE", accessories, "RippleTape", List.of("IMG_20260624_144146.jpg"));
        bundledProduct("Runner 23# L", "GLYDE-ACC-RUNNER-23-L", accessories, "Runner 23# L", List.of("RUNNER_L.png"));
        bundledProduct("Silent Runner", "GLYDE-ACC-SILENT-RUNNER", accessories, "SilentRunner", List.of(
                "IMG_20260624_143142.jpg", "IMG_20260624_143206.jpg", "video_20260624_142018 (online-video-cutter.com).mp4", "video_20260624_143148.mp4"));

        log.info("Official Glyde catalogue products are available.");
    }

    private Category category(String name, String description, int sortOrder) {
        return categoryRepository.findByNameIgnoreCase(name).orElseGet(() -> {
            Category category = new Category();
            category.setName(name);
            category.setDescription(description);
            category.setSortOrder(sortOrder);
            category.setIsActive(true);
            category.setIsVisible(true);
            return categoryRepository.save(category);
        });
    }

    private Product product(String name, String sku, Category category, String description,
                            boolean featured, boolean newArrival) {
        return productRepository.findBySku(sku).orElseGet(() -> {
            Product product = new Product();
            product.setName(name);
            product.setSku(sku);
            product.setCategoryId(category.getId());
            product.setBrand("GLYDE");
            product.setShortDescription(description);
            product.setLongDescription(description);
            product.setMaterial("Not specified");
            product.setPattern("Not specified");
            product.setBasePrice(BigDecimal.ZERO);
            product.setStockQuantity(0);
            product.setStatus(ProductStatus.ACTIVE);
            product.setIsFeatured(featured);
            product.setIsNewArrival(newArrival);
            product.setIsTrending(featured || newArrival);
            product.setIsBestSeller(false);
            product.setIsPremium(false);
            product.setTags("glyde,official catalogue");
            return productRepository.save(product);
        });
    }

    private void bundledProduct(String name, String sku, Category category, String directory, List<String> files) {
        Product product = product(name, sku, category,
                "Glyde Curtains accessory. Contact us for price and availability.", false, false);
        bundledProduct(product, directory, files);
    }

    private void bundledProduct(Product product, String directory, List<String> files) {
        List<ProductImage> existingImages = productImageRepository.findByProductIdOrderBySortOrderAsc(product.getId());
        Set<String> existingFilenames = new HashSet<>();
        existingImages.forEach(image -> existingFilenames.add(image.getOriginalFilename()));

        int sortOrder = existingImages.size();
        for (String filename : files) {
            if (existingFilenames.contains(filename)) {
                continue;
            }
            ProductImage media = new ProductImage();
            media.setProduct(product);
            media.setBase64Data(staticMediaUrl(directory, filename));
            media.setMimeType(filename.toLowerCase().endsWith(".mp4") ? "video/mp4" : imageMimeType(filename));
            media.setMediaType(filename.toLowerCase().endsWith(".mp4") ? MediaType.VIDEO : MediaType.IMAGE);
            media.setOriginalFilename(filename);
            media.setIsThumbnail(existingImages.isEmpty() && sortOrder == 0);
            media.setSortOrder(sortOrder++);
            productImageRepository.save(media);
        }
    }

    private String staticMediaUrl(String directory, String filename) {
        String path = "products/accessories/" + (directory.isBlank() ? "" : directory + "/") + filename;
        return "/" + UriUtils.encodePath(path, java.nio.charset.StandardCharsets.UTF_8);
    }

    private String imageMimeType(String filename) {
        return filename.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
    }

    private void addBundledImage(Product product, String resourcePath, String filename) {
        if (productImageRepository.findByProductIdOrderBySortOrderAsc(product.getId()).isEmpty()) {
            try {
                byte[] bytes = new ClassPathResource(resourcePath).getInputStream().readAllBytes();
                ProductImage image = new ProductImage();
                image.setProduct(product);
                image.setBase64Data(Base64.getEncoder().encodeToString(bytes));
                image.setMimeType("image/jpeg");
                image.setMediaType(MediaType.IMAGE);
                image.setOriginalFilename(filename);
                image.setIsThumbnail(true);
                image.setSortOrder(0);
                productImageRepository.save(image);
            } catch (IOException exception) {
                log.warn("Unable to load bundled official catalogue image {}", resourcePath, exception);
            }
        }
    }
}
