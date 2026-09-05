package com.glydecurtains.config;

import com.glydecurtains.entity.Category;
import com.glydecurtains.entity.Product;
import com.glydecurtains.entity.ProductImage;
import com.glydecurtains.entity.SubCategory;
import com.glydecurtains.entity.enums.MediaType;
import com.glydecurtains.entity.enums.ProductStatus;
import com.glydecurtains.repository.CategoryRepository;
import com.glydecurtains.repository.ProductImageRepository;
import com.glydecurtains.repository.ProductRepository;
import com.glydecurtains.repository.SubCategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.UriUtils;

import java.math.BigDecimal;
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

    private static final Set<String> ACCESSORY_SKUS = Set.of(
            "GLYDE-ACC-JUMBO-RUNNER", "GLYDE-ACC-20-CEILING", "GLYDE-ACC-20-ENDCAP",
            "GLYDE-ACC-20-WALL", "GLYDE-ACC-23-ENDCAP", "GLYDE-ACC-23-WALL",
            "GLYDE-ACC-BICHO-CEILING", "GLYDE-ACC-CEILING", "GLYDE-ACC-DOUBLE-CEILING",
            "GLYDE-ACC-DOUBLE-WALL", "GLYDE-ACC-RIPPLE-RUNNER", "GLYDE-ACC-RIPPLE-TAPE",
            "GLYDE-ACC-RUNNER-23-L", "GLYDE-ACC-SILENT-RUNNER"
    );

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final SubCategoryRepository subCategoryRepository;

    @Override
    @Transactional
    public void run(org.springframework.boot.ApplicationArguments args) {
        Category accessories = category("Accessories", "Essential curtain accessories and hardware", 4);
        if (!productRepository.existsBySku("GLYDE-ACC-JUMBO-RUNNER")) {
            removeNonAccessoryProducts();
        }
        SubCategory runners = subCategory(accessories, "Track Runners", 1);
        SubCategory ceiling = subCategory(accessories, "Ceiling Fittings", 2);
        SubCategory wall = subCategory(accessories, "Wall Fittings", 3);
        SubCategory endCaps = subCategory(accessories, "End Caps", 4);
        SubCategory tapes = subCategory(accessories, "Curtain Tapes", 5);

        bundledProduct("Jumbo Runner", "GLYDE-ACC-JUMBO-RUNNER", accessories, runners, "JumboRunner", new BigDecimal("549.00"), 48, List.of("Runner-H.png.jpg", "IMG_20260624_143015.jpg", "IMG_20260624_143046.jpg", "video_20260624_142018 (online-video-cutter.com) (1).mp4", "video_20260624_143027.mp4"));
        bundledProduct("20# Ceiling", "GLYDE-ACC-20-CEILING", accessories, ceiling, "20#Ceiling", new BigDecimal("699.00"), 32, List.of("IMG_20260624_143604.jpg", "IMG_20260624_143610.jpg", "video_20260624_142018 (online-video-cutter.com).mp4", "video_20260624_143618.mp4"));
        bundledProduct("20# End Cap", "GLYDE-ACC-20-ENDCAP", accessories, endCaps, "20#EndCap", new BigDecimal("129.00"), 90, List.of("IMG_20260624_143937.jpg", "IMG_20260624_143956.jpg", "video_20260624_142018 (online-video-cutter.com).mp4", "video_20260624_144001.mp4"));
        bundledProduct("20# Wall", "GLYDE-ACC-20-WALL", accessories, wall, "20#Wall", new BigDecimal("649.00"), 36, List.of("IMG_20260624_143346.jpg", "IMG_20260624_143403.jpg", "video_20260624_142018 (online-video-cutter.com).mp4", "video_20260624_143352.mp4"));
        bundledProduct("23# End Cap", "GLYDE-ACC-23-ENDCAP", accessories, endCaps, "23#EndCap", new BigDecimal("149.00"), 84, List.of("endcap.png"));
        bundledProduct("23# Wall", "GLYDE-ACC-23-WALL", accessories, wall, "23#wall", new BigDecimal("749.00"), 28, List.of("Photoroom-20250111_130630_wm.png.jpg", "IMG_20260624_142149.jpg", "IMG_20260624_142437.jpg", "video_20260624_142018 (online-video-cutter.com).mp4", "video_20260624_142159.mp4"));
        bundledProduct("Bicho Ceiling", "GLYDE-ACC-BICHO-CEILING", accessories, ceiling, "BichoCeiling", new BigDecimal("799.00"), 24, List.of("IMG_20260624_142338.jpg", "IMG_20260624_142423.jpg", "video_20260624_142018 (online-video-cutter.com).mp4", "video_20260624_142402.mp4"));
        bundledProduct("Ceiling", "GLYDE-ACC-CEILING", accessories, ceiling, "Ceiling", new BigDecimal("599.00"), 40, List.of("ceiling.png", "IMG_20260624_142734.jpg", "IMG_20260624_142811.jpg", "video_20260624_142018 (online-video-cutter.com).mp4", "video_20260624_142749.mp4"));
        bundledProduct("Double Ceiling", "GLYDE-ACC-DOUBLE-CEILING", accessories, ceiling, "DoubleCeiling", new BigDecimal("899.00"), 18, List.of("23# Double Ceiling.jpg", "23# Double Ceiling1.jpg", "micro_movie_20260624_141918.mp4", "video_20260624_142018 (online-video-cutter.com).mp4"));
        bundledProduct("Double Wall", "GLYDE-ACC-DOUBLE-WALL", accessories, wall, "Doublewall", new BigDecimal("849.00"), 22, List.of("WallBracketDouble.png.jpg", "IMG_20260624_141943.jpg", "IMG_20260624_142502.jpg", "video_20260624_142018 (online-video-cutter.com).mp4"));
        bundledProduct("Ripple Runner", "GLYDE-ACC-RIPPLE-RUNNER", accessories, runners, "Ripple Runner", new BigDecimal("649.00"), 35, List.of("IMG_20260624_144231.jpg", "video_20260624_142018 (online-video-cutter.com).mp4", "video_20260624_144241.mp4", "video_20260624_144257.mp4"));
        bundledProduct("Ripple Tape", "GLYDE-ACC-RIPPLE-TAPE", accessories, tapes, "RippleTape", new BigDecimal("249.00"), 65, List.of("IMG_20260624_144146.jpg"));
        bundledProduct("Runner 23# L", "GLYDE-ACC-RUNNER-23-L", accessories, runners, "Runner 23# L", new BigDecimal("499.00"), 52, List.of("RUNNER_L.png"));
        bundledProduct("Silent Runner", "GLYDE-ACC-SILENT-RUNNER", accessories, runners, "SilentRunner", new BigDecimal("749.00"), 30, List.of("IMG_20260624_143142.jpg", "IMG_20260624_143206.jpg", "video_20260624_142018 (online-video-cutter.com).mp4", "video_20260624_143148.mp4"));

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

    private Product product(String name, String sku, Category category, SubCategory subCategory, BigDecimal price, int stock) {
        return productRepository.findBySku(sku).orElseGet(() -> {
            Product product = new Product();
            product.setName(name);
            product.setSku(sku);
            product.setCategoryId(category.getId());
            product.setBrand("GLYDE");
            product.setSubCategoryId(subCategory.getId());
            product.setShortDescription("Glyde Curtains accessory. Contact us for installation and bulk pricing.");
            product.setLongDescription("Reliable curtain hardware selected for smooth operation and a clean finish.");
            product.setMaterial("Aluminium");
            product.setPattern("Solid");
            product.setBasePrice(price);
            product.setStockQuantity(stock);
            product.setStatus(ProductStatus.ACTIVE);
            product.setIsFeatured(true);
            product.setIsNewArrival(true);
            product.setIsTrending(true);
            product.setIsBestSeller(false);
            product.setIsPremium(false);
            product.setTags("glyde,official catalogue");
            return productRepository.save(product);
        });
    }

    private void bundledProduct(String name, String sku, Category category, SubCategory subCategory, String directory,
                                BigDecimal price, int stock, List<String> files) {
        Product product = product(name, sku, category, subCategory, price, stock);
        bundledProduct(product, directory, files);
    }

    private SubCategory subCategory(Category category, String name, int sortOrder) {
        return subCategoryRepository.findByCategoryId(category.getId()).stream()
                .filter(item -> item.getName().equalsIgnoreCase(name))
                .findFirst()
                .orElseGet(() -> subCategoryRepository.save(new SubCategory(null, name, category.getId(), null, sortOrder, true)));
    }

    private void removeNonAccessoryProducts() {
        productRepository.findAll().stream()
                .filter(product -> !ACCESSORY_SKUS.contains(product.getSku()))
                .forEach(productRepository::delete);
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

}
