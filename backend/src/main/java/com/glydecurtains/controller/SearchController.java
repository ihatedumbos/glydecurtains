package com.glydecurtains.controller;

import com.glydecurtains.dto.request.SearchRequest;
import com.glydecurtains.dto.response.ApiResponse;
import com.glydecurtains.dto.response.PageResponse;
import com.glydecurtains.dto.response.ProductResponse;
import com.glydecurtains.service.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;

    /**
     * Search products with filters, sorting, and relevance ordering.
     * Public endpoint - no authentication required.
     */
    @GetMapping("/products")
    public ResponseEntity<ApiResponse<PageResponse<ProductResponse>>> searchProducts(
            SearchRequest request,
            @PageableDefault(size = 20) Pageable pageable) {
        PageResponse<ProductResponse> response = searchService.search(request, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Autocomplete suggestions for product search.
     * Returns product names matching the query (min 2 chars).
     * Public endpoint - no authentication required.
     */
    @GetMapping("/autocomplete")
    public ResponseEntity<ApiResponse<List<String>>> autocomplete(
            @RequestParam String query) {
        List<String> suggestions = searchService.autocomplete(query);
        return ResponseEntity.ok(ApiResponse.success(suggestions));
    }

    /**
     * Get recent searches for the authenticated user (max 10).
     * Returns empty list if user is not authenticated.
     */
    @GetMapping("/recent")
    public ResponseEntity<ApiResponse<List<String>>> getRecentSearches() {
        List<String> recentSearches = searchService.getRecentSearches();
        return ResponseEntity.ok(ApiResponse.success(recentSearches));
    }

    /**
     * Clear recent searches for the authenticated user.
     */
    @DeleteMapping("/recent")
    public ResponseEntity<ApiResponse<Void>> clearRecentSearches() {
        searchService.clearRecentSearches();
        return ResponseEntity.ok(ApiResponse.success("Recent searches cleared", null));
    }
}
