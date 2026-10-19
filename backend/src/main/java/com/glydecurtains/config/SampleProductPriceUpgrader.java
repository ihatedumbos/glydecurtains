package com.glydecurtains.config;

import com.glydecurtains.entity.Product;
import com.glydecurtains.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Map;

/**
 * The nine sample products from the original seed data carry invented prices. Until the owner
 * sets real ones in the admin panel they show "Price on request" (price 0) instead. A product
 * whose price was already changed from the invented one is left alone.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class SampleProductPriceUpgrader implements ApplicationRunner {

    static final Map<String, BigDecimal> INVENTED_PRICES = Map.of(
            "GC-CUR-001", new BigDecimal("2499"),
            "GC-CUR-002", new BigDecimal("899"),
            "GC-CUR-003", new BigDecimal("1599"),
            "GC-ROD-001", new BigDecimal("1299"),
            "GC-ROD-002", new BigDecimal("999"),
            "GC-TRK-001", new BigDecimal("1799"),
            "GC-TRK-002", new BigDecimal("5999"),
            "GC-ACC-001", new BigDecimal("699"),
            "GC-ACC-002", new BigDecimal("449"));

    private final ProductRepository productRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        int cleared = 0;
        for (Map.Entry<String, BigDecimal> entry : INVENTED_PRICES.entrySet()) {
            Product product = productRepository.findBySku(entry.getKey()).orElse(null);
            if (product == null || product.getBasePrice() == null
                    || product.getBasePrice().compareTo(entry.getValue()) != 0) {
                continue;
            }
            product.setBasePrice(BigDecimal.ZERO);
            product.setDiscountPercentage(BigDecimal.ZERO);
            product.setOfferPrice(BigDecimal.ZERO);
            product.getVariants().forEach(variant -> variant.setPrice(BigDecimal.ZERO));
            productRepository.save(product);
            cleared++;
        }
        if (cleared > 0) {
            log.info("Sample products now show 'Price on request' instead of invented prices: {}", cleared);
        }
    }
}
