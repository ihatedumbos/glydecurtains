package com.glydecurtains.dto.response;

import com.glydecurtains.entity.enums.ProductStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {

    private Long id;
    private String name;
    private String sku;
    private String barcode;
    private String shortDescription;
    private Long categoryId;
    private String categoryName;
    private Long subCategoryId;
    private String subCategoryName;
    private Long collectionId;
    private String collectionName;
    private String brand;
    private String material;
    private String pattern;
    private List<String> colors;
    private List<String> sizes;
    private Integer stockQuantity;
    private BigDecimal basePrice;
    private BigDecimal discountPercentage;
    private BigDecimal offerPrice;
    private ProductStatus status;
    private Boolean isFeatured;
    private Boolean isTrending;
    private Boolean isNewArrival;
    private Boolean isBestSeller;
    private Boolean isPremium;
    private List<String> tags;
    private String thumbnailBase64;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
