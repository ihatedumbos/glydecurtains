package com.glydecurtains.service.impl;

import com.glydecurtains.dto.request.ProductFilterRequest;
import com.glydecurtains.dto.request.SearchRequest;
import com.glydecurtains.dto.response.PageResponse;
import com.glydecurtains.dto.response.ProductResponse;
import com.glydecurtains.entity.Product;
import com.glydecurtains.entity.RecentSearch;
import com.glydecurtains.entity.enums.ProductStatus;
import com.glydecurtains.repository.ProductRepository;
import com.glydecurtains.repository.RecentSearchRepository;
import com.glydecurtains.repository.TranslatedContentRepository;
import com.glydecurtains.service.ProductService;
import com.glydecurtains.service.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SearchServiceImpl implements SearchService {

    private static final int MAX_RECENT_SEARCHES = 10;
    private static final int AUTOCOMPLETE_LIMIT = 10;

    private final ProductService productService;
    private final ProductRepository productRepository;
    private final TranslatedContentRepository translatedContentRepository;
    private final RecentSearchRepository recentSearchRepository;

    /**
     * Filters, sorts and paginates active products in the database, sharing the exact same
     * filter/sort logic (and response mapping) as the public product listing.
     */
    @Override
    @Transactional
    public PageResponse<ProductResponse> search(SearchRequest request, Pageable pageable) {
        Long currentUserId = getCurrentUserId();
        if (currentUserId != null && request.getQuery() != null && !request.getQuery().isBlank()) {
            saveRecentSearch(currentUserId, request.getQuery().trim());
        }

        ProductFilterRequest filter = ProductFilterRequest.builder()
                .query(request.getQuery())
                .categoryId(request.getCategoryId())
                .subCategoryId(request.getSubCategoryId())
                .collectionId(request.getCollectionId())
                .colors(request.getColors())
                .sizes(request.getSizes())
                .material(request.getMaterial())
                .materials(request.getMaterials())
                .minPrice(request.getMinPrice())
                .maxPrice(request.getMaxPrice())
                .inStock(request.getInStock())
                .sortBy(request.getSortBy())
                .status(ProductStatus.ACTIVE)
                .build();

        // Ordering comes from sortBy only; drop any Pageable sort so the two can't conflict.
        return productService.getProducts(filter, PageRequest.of(pageable.getPageNumber(), pageable.getPageSize()));
    }

    @Override
    @Transactional(readOnly = true)
    public List<String> autocomplete(String query) {
        if (query == null || query.trim().length() < 2) {
            return Collections.emptyList();
        }
        String text = query.trim();

        // Prefix matches first, then other "contains" matches, then translated names.
        Set<String> suggestions = new LinkedHashSet<>();
        productRepository.findTop10ByStatusAndNameStartingWithIgnoreCaseOrderByNameAsc(ProductStatus.ACTIVE, text)
                .stream().map(Product::getName).forEach(suggestions::add);
        productRepository.findTop20ByStatusAndNameContainingIgnoreCaseOrderByNameAsc(ProductStatus.ACTIVE, text)
                .stream().map(Product::getName).forEach(suggestions::add);
        if (suggestions.size() < AUTOCOMPLETE_LIMIT) {
            suggestions.addAll(translatedContentRepository.findProductNamesContaining(
                    text, PageRequest.of(0, AUTOCOMPLETE_LIMIT)));
        }

        return suggestions.stream()
                .limit(AUTOCOMPLETE_LIMIT)
                .collect(Collectors.toList());
    }

    @Override
    public List<String> getRecentSearches() {
        Long currentUserId = getCurrentUserId();
        if (currentUserId == null) {
            return Collections.emptyList();
        }

        return recentSearchRepository.findByUserIdOrderBySearchedAtDesc(currentUserId)
                .stream()
                .limit(MAX_RECENT_SEARCHES)
                .map(RecentSearch::getQuery)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void clearRecentSearches() {
        Long currentUserId = getCurrentUserId();
        if (currentUserId != null) {
            recentSearchRepository.deleteByUserId(currentUserId);
        }
    }

    // --- Private helpers ---

    private void saveRecentSearch(Long userId, String query) {
        // Check if search already exists, update timestamp if so
        Optional<RecentSearch> existing = recentSearchRepository.findByUserIdAndQuery(userId, query);
        if (existing.isPresent()) {
            existing.get().setSearchedAt(LocalDateTime.now());
            recentSearchRepository.save(existing.get());
            return;
        }

        // Remove the oldest search once the limit is reached
        long count = recentSearchRepository.countByUserId(userId);
        if (count >= MAX_RECENT_SEARCHES) {
            List<RecentSearch> searches = recentSearchRepository.findByUserIdOrderBySearchedAtDesc(userId);
            if (searches.size() >= MAX_RECENT_SEARCHES) {
                recentSearchRepository.delete(searches.get(searches.size() - 1));
            }
        }

        recentSearchRepository.save(new RecentSearch(userId, query));
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Long userId) {
            return userId;
        }
        return null;
    }
}
