package com.glydecurtains.dto.request;

import com.glydecurtains.entity.enums.ProductStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductFilterRequest {

    private String query;
    private Long categoryId;
    private Long subCategoryId;
    private Long collectionId;
    // Comma-separated list of values (e.g. "Red,Blue"). Renamed from the
    // singular "color"/"size" so multiple values can be sent, and so "size"
    // no longer collides with Spring's Pageable "size" (page size) query param.
    private String colors;
    private String sizes;
    private String material;
    // Comma-separated list of materials; matched case-insensitively (any of).
    private String materials;
    private BigDecimal minPrice;
    private BigDecimal maxPrice;
    private ProductStatus status;
    private Boolean isFeatured;
    private Boolean isTrending;
    private Boolean isNewArrival;
    private Boolean isBestSeller;
    private Boolean isPremium;
    // Only products with stockQuantity > 0 when true.
    private Boolean inStock;
    // Named sort applied in the database: relevance, popularity, newest, price_asc,
    // price_desc, featured. When set it takes precedence over a Pageable "sort" param.
    private String sortBy;
}
