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
    private String color;
    private String size;
    private String material;
    private BigDecimal minPrice;
    private BigDecimal maxPrice;
    private Boolean inStock;
    private String sortBy; // popularity, newest, price_asc, price_desc, featured
    private String language; // for multi-language search
}
