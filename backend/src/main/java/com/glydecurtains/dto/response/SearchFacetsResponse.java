package com.glydecurtains.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/** Filter options that actually exist on active products, for the storefront filter sidebar. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchFacetsResponse {
    private List<String> materials;
    private List<String> colors;
    private List<String> sizes;
    private BigDecimal maxPrice;
}
