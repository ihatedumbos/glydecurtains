package com.glydecurtains.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchRequest {

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
    private BigDecimal minPrice;
    private BigDecimal maxPrice;
    private Boolean inStock;
    private String sortBy; // popularity, newest, price_asc, price_desc, featured
    private String language; // for multi-language search
}
