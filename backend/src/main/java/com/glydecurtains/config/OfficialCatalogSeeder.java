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

import java.io.IOException;
import java.math.BigDecimal;
import java.util.Base64;

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

        product("E102 White", "GLYDE-E102-WHITE", tracks,
                "Heavy duty aluminium curtain track designed for long life and silent operation.", true, false);
        product("R201 Round Curtain Ring", "GLYDE-R201", rings,
                "Premium quality curtain rings with smooth movement and elegant finish.", false, true);
        product("T301 Curtain Tape", "GLYDE-T301", tapes,
                "High quality curtain tape suitable for pencil pleat curtains.", false, false);

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
