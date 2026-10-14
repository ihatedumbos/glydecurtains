package com.glydecurtains.config;

import com.glydecurtains.entity.ProductImage;
import com.glydecurtains.entity.enums.MediaType;
import com.glydecurtains.repository.ProductImageRepository;
import com.glydecurtains.repository.spec.ProductSpecifications;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Products seeded without real photos carry a 1x1 black placeholder, which shows up as a black
 * square on the site. Point those images at a branded "Photo coming soon" picture instead, until
 * a real photo is uploaded from the admin panel. Real photos are never touched.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ProductPlaceholderImageUpgrader implements ApplicationRunner {

    static final String PLACEHOLDER_PATH = "/products/accessories/placeholder/photo-coming-soon.jpg";

    private final ProductImageRepository productImageRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        List<ProductImage> placeholders = productImageRepository.findWithDataNoLongerThan(PlaceholderMedia.MAX_LENGTH)
                .stream()
                .filter(image -> image.getMediaType() == MediaType.IMAGE)
                .filter(image -> PlaceholderMedia.isPlaceholder(image.getBase64Data()))
                .toList();
        if (placeholders.isEmpty()) {
            return;
        }
        placeholders.forEach(image -> {
            image.setBase64Data(PLACEHOLDER_PATH);
            image.setMimeType("image/jpeg");
            // Marks the image as a stand-in so product lists can sort real photos first.
            image.setOriginalFilename(ProductSpecifications.PLACEHOLDER_IMAGE_FILENAME);
        });
        productImageRepository.saveAll(placeholders);
        log.info("Pointed {} placeholder product image(s) at the 'photo coming soon' picture.", placeholders.size());
    }
}
