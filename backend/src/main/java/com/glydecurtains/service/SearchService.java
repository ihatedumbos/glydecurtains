package com.glydecurtains.service;

import com.glydecurtains.dto.request.SearchRequest;
import com.glydecurtains.dto.response.PageResponse;
import com.glydecurtains.dto.response.ProductResponse;
import com.glydecurtains.dto.response.SearchFacetsResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface SearchService {

    PageResponse<ProductResponse> search(SearchRequest request, Pageable pageable);

    List<String> autocomplete(String query);

    SearchFacetsResponse getFacets();

    List<String> getRecentSearches();

    void clearRecentSearches();
}
