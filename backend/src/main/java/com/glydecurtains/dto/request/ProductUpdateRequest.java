package com.glydecurtains.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductUpdateRequest {

    @Size(max = 200, message = "Product name must not exceed 200 characters")
    private String name;

    private String sku;

    private String barcode;

    @Size(max = 500, message = "Short description must not exceed 500 characters")
    private String shortDescription;

    private String longDescription;

    private Long categoryId;

    private Long subCategoryId;

    private Long collectionId;

    private String brand;

    private String material;

    private String pattern;

    private List<String> colors;

    private List<String> sizes;

    private Double length;

    private Double width;

    private Double height;

    private Double weight;

    @Min(value = 0, message = "Stock quantity must be zero or greater")
    private Integer stockQuantity;

    @DecimalMin(value = "0.01", message = "Base price must be greater than zero")
    private BigDecimal basePrice;

    @DecimalMin(value = "0.00", message = "Discount percentage must be zero or greater")
    @DecimalMax(value = "100.00", message = "Discount percentage must not exceed 100")
    private BigDecimal discountPercentage;

    private Boolean isFeatured;
    private Boolean isTrending;
    private Boolean isNewArrival;
    private Boolean isBestSeller;
    private Boolean isPremium;

    private List<String> tags;

    private String metaTitle;
    private String metaDescription;
    private String metaKeywords;
}
