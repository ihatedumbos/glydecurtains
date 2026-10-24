package com.glydecurtains.controller;

import com.glydecurtains.entity.Product;
import com.glydecurtains.entity.enums.ProductStatus;
import com.glydecurtains.repository.ProductRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SitemapControllerTest {

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private SitemapController controller;

    @Test
    void listsStaticPagesAndActiveProducts() {
        ReflectionTestUtils.setField(controller, "storefrontUrl", "https://glydecurtains.com/");
        Product product = new Product();
        product.setId(7L);
        product.setUpdatedAt(LocalDateTime.of(2026, 10, 20, 9, 30));
        when(productRepository.findByStatus(ProductStatus.ACTIVE)).thenReturn(List.of(product));

        String xml = controller.sitemap().getBody();

        assertNotNull(xml);
        assertTrue(xml.contains("<loc>https://glydecurtains.com/</loc>"));
        assertTrue(xml.contains("<loc>https://glydecurtains.com/contact</loc>"));
        assertTrue(xml.contains("<loc>https://glydecurtains.com/products/7</loc><lastmod>2026-10-20</lastmod>"));
        assertFalse(xml.contains("/admin"));
    }
}
