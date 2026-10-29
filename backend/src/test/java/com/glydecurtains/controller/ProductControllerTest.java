package com.glydecurtains.controller;

import com.glydecurtains.dto.response.ProductDetailResponse;
import com.glydecurtains.dto.response.ProductSpecificationResponse;
import com.glydecurtains.service.ProductService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProductControllerTest {

    @Mock private ProductService productService;
    @InjectMocks private ProductController controller;

    @Test
    void publicProductLeavesOutHiddenSpecifications() {
        ProductDetailResponse product = ProductDetailResponse.builder()
                .id(1L)
                .internalName("shop only")
                .specifications(new ArrayList<>(List.of(
                        spec("Combined weight per metre", true),
                        spec("PVC insert weight", false),
                        spec("Old row", null))))
                .build();
        when(productService.getProduct(1L, null)).thenReturn(product);

        ProductDetailResponse body = controller.getPublicProduct(1L, null).getBody().getData();

        assertNull(body.getInternalName());
        assertEquals(List.of("Combined weight per metre", "Old row"),
                body.getSpecifications().stream().map(ProductSpecificationResponse::getSpecKey).toList());
    }

    private static ProductSpecificationResponse spec(String key, Boolean shown) {
        return ProductSpecificationResponse.builder().specKey(key).specValue("x").showToCustomers(shown).build();
    }
}
