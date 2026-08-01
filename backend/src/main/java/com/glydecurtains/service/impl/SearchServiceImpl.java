package com.glydecurtains.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.glydecurtains.dto.request.SearchRequest;
import com.glydecurtains.dto.response.PageResponse;
import com.glydecurtains.dto.response.ProductResponse;
import com.glydecurtains.entity.*;
import com.glydecurtains.entity.enums.ProductStatus;
import com.glydecurtains.repository.*;
import com.glydecurtains.service.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SearchServiceImpl implements SearchService {

    private static final int MAX_RECENT_SEARCHES = 10;
    private static final int AUTOCOMPLETE_LIMIT = 10;

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final SubCategoryRepository subCategoryRepository;
    private final CollectionRepository collectionRepository;
    private final TranslatedContentRepository translatedContentRepository;
    private final RecentSearchRepository recentSearchRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public PageResponse<ProductResponse> search(SearchRequest request, Pageable pageable) {
        // Save recent search for authenticated users
        Long currentUserId = getCurrentUserId();
        if (currentUserId != null && request.getQuery() != null && !request.getQuery().isBlank()) {
            saveRecentSearch(currentUserId, request.getQuery().trim());
        }

        // Fetch all active products (exclude deactivated/archived)
        List<Product> allProducts = productRepository.findByStatus(ProductStatus.ACTIVE);

        // Apply text search with relevance
        List<Product> filtered = applyTextSearch(allProducts, request);

        // Apply filters
        filtered = applyFilters(filtered, request);

        // Apply sorting
        filtered = applySorting(filtered, request.getSortBy());

        // Paginate
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), filtered.size());
        List<Product> pageContent = start >= filtered.size()
                ? Collections.emptyList()
                : filtered.subList(start, end);

        List<ProductResponse> responses = pageContent.stream()
                .map(this::mapToProductResponse)
                .collect(Collectors.toList());

        Page<ProductResponse> page = new PageImpl<>(responses, pageable, filtered.size());
        return PageResponse.from(page);
    }

    @Override
    public List<String> autocomplete(String query) {
        if (query == null || query.trim().length() < 2) {
            return Collections.emptyList();
        }

        String lowerQuery = query.trim().toLowerCase();

        // Search product names for matches
        List<Product> activeProducts = productRepository.findByStatus(ProductStatus.ACTIVE);

        Set<String> suggestions = new LinkedHashSet<>();

        // Exact prefix matches first (higher relevance)
        activeProducts.stream()
                .filter(p -> p.getName().toLowerCase().startsWith(lowerQuery))
                .map(Product::getName)
                .forEach(suggestions::add);

        // Contains matches next
        activeProducts.stream()
                .filter(p -> p.getName().toLowerCase().contains(lowerQuery)
                        && !p.getName().toLowerCase().startsWith(lowerQuery))
                .map(Product::getName)
                .forEach(suggestions::add);

        // Also search translated content for multi-language support
        List<TranslatedContent> translations = translatedContentRepository
                .findByEntityTypeAndEntityId("product", null);
        // Since we can't query by partial content easily, do in-memory search across all product translations
        searchTranslatedNames(lowerQuery, suggestions);

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

    private List<Product> applyTextSearch(List<Product> products, SearchRequest request) {
        String query = request.getQuery();
        if (query == null || query.isBlank()) {
            return products;
        }

        String lowerQuery = query.trim().toLowerCase();
        String language = request.getLanguage();

        // Get product IDs that match via translated content
        Set<Long> translatedMatchIds = getTranslatedMatchProductIds(lowerQuery, language);

        // Score each product for relevance
        List<ScoredProduct> scoredProducts = products.stream()
                .map(p -> new ScoredProduct(p, calculateRelevanceScore(p, lowerQuery, translatedMatchIds)))
                .filter(sp -> sp.score > 0)
                .sorted(Comparator.comparingInt(ScoredProduct::getScore).reversed())
                .collect(Collectors.toList());

        return scoredProducts.stream()
                .map(ScoredProduct::getProduct)
                .collect(Collectors.toList());
    }

    private int calculateRelevanceScore(Product product, String lowerQuery, Set<Long> translatedMatchIds) {
        int score = 0;

        // Exact name match (highest relevance)
        if (product.getName().toLowerCase().equals(lowerQuery)) {
            score += 100;
        }
        // Name starts with query
        else if (product.getName().toLowerCase().startsWith(lowerQuery)) {
            score += 80;
        }
        // Name contains query
        else if (product.getName().toLowerCase().contains(lowerQuery)) {
            score += 60;
        }

        // SKU match
        if (product.getSku() != null && product.getSku().toLowerCase().contains(lowerQuery)) {
            score += 40;
        }

        // Brand match
        if (product.getBrand() != null && product.getBrand().toLowerCase().contains(lowerQuery)) {
            score += 30;
        }

        // Tags match
        if (product.getTags() != null && product.getTags().toLowerCase().contains(lowerQuery)) {
            score += 20;
        }

        // Material match
        if (product.getMaterial() != null && product.getMaterial().toLowerCase().contains(lowerQuery)) {
            score += 15;
        }

        // Description match
        if (product.getShortDescription() != null && product.getShortDescription().toLowerCase().contains(lowerQuery)) {
            score += 10;
        }

        // Multi-language translated content match
        if (translatedMatchIds.contains(product.getId())) {
            score += 50;
        }

        return score;
    }

    private Set<Long> getTranslatedMatchProductIds(String lowerQuery, String language) {
        Set<Long> matchIds = new HashSet<>();

        // Search across all product translations
        List<TranslatedContent> allProductTranslations;
        if (language != null && !language.isBlank()) {
            // Search in specific language
            allProductTranslations = translatedContentRepository
                    .findByEntityTypeAndEntityIdAndLanguage("product", null, language);
            // The above won't work well, so let's get all product translations
            allProductTranslations = getAllProductTranslations(language);
        } else {
            allProductTranslations = getAllProductTranslations(null);
        }

        for (TranslatedContent tc : allProductTranslations) {
            if (tc.getContent() != null && tc.getContent().toLowerCase().contains(lowerQuery)) {
                matchIds.add(tc.getEntityId());
            }
        }

        return matchIds;
    }

    private List<TranslatedContent> getAllProductTranslations(String language) {
        // Get all translated content for products
        List<TranslatedContent> all = translatedContentRepository.findAll();
        return all.stream()
                .filter(tc -> "product".equals(tc.getEntityType()))
                .filter(tc -> language == null || language.equals(tc.getLanguage()))
                .collect(Collectors.toList());
    }

    private void searchTranslatedNames(String lowerQuery, Set<String> suggestions) {
        List<TranslatedContent> translations = translatedContentRepository.findAll().stream()
                .filter(tc -> "product".equals(tc.getEntityType()))
                .filter(tc -> "name".equals(tc.getFieldName()))
                .filter(tc -> tc.getContent() != null && tc.getContent().toLowerCase().contains(lowerQuery))
                .collect(Collectors.toList());

        for (TranslatedContent tc : translations) {
            suggestions.add(tc.getContent());
        }
    }

    private List<Product> applyFilters(List<Product> products, SearchRequest request) {
        return products.stream()
                .filter(p -> filterByCategory(p, request.getCategoryId()))
                .filter(p -> filterBySubCategory(p, request.getSubCategoryId()))
                .filter(p -> filterByCollection(p, request.getCollectionId()))
                .filter(p -> filterByColor(p, request.getColor()))
                .filter(p -> filterBySize(p, request.getSize()))
                .filter(p -> filterByMaterial(p, request.getMaterial()))
                .filter(p -> filterByPriceRange(p, request.getMinPrice(), request.getMaxPrice()))
                .filter(p -> filterByAvailability(p, request.getInStock()))
                .collect(Collectors.toList());
    }

    private boolean filterByCategory(Product product, Long categoryId) {
        return categoryId == null || categoryId.equals(product.getCategoryId());
    }

    private boolean filterBySubCategory(Product product, Long subCategoryId) {
        return subCategoryId == null || subCategoryId.equals(product.getSubCategoryId());
    }

    private boolean filterByCollection(Product product, Long collectionId) {
        return collectionId == null || collectionId.equals(product.getCollectionId());
    }

    private boolean filterByColor(Product product, String color) {
        if (color == null || color.isBlank()) return true;
        List<String> colors = fromJson(product.getColors());
        return colors.stream().anyMatch(c -> c.equalsIgnoreCase(color));
    }

    private boolean filterBySize(Product product, String size) {
        if (size == null || size.isBlank()) return true;
        List<String> sizes = fromJson(product.getSizes());
        return sizes.stream().anyMatch(s -> s.equalsIgnoreCase(size));
    }

    private boolean filterByMaterial(Product product, String material) {
        if (material == null || material.isBlank()) return true;
        return product.getMaterial() != null && product.getMaterial().equalsIgnoreCase(material);
    }

    private boolean filterByPriceRange(Product product, BigDecimal minPrice, BigDecimal maxPrice) {
        BigDecimal effectivePrice = product.getOfferPrice() != null ? product.getOfferPrice() : product.getBasePrice();
        if (minPrice != null && effectivePrice.compareTo(minPrice) < 0) return false;
        if (maxPrice != null && effectivePrice.compareTo(maxPrice) > 0) return false;
        return true;
    }

    private boolean filterByAvailability(Product product, Boolean inStock) {
        if (inStock == null) return true;
        if (inStock) {
            return product.getStockQuantity() != null && product.getStockQuantity() > 0;
        }
        return true; // If inStock=false, show all (including out of stock)
    }

    private List<Product> applySorting(List<Product> products, String sortBy) {
        if (sortBy == null || sortBy.isBlank()) {
            return products; // Keep relevance ordering from text search
        }

        switch (sortBy.toLowerCase()) {
            case "popularity":
                // Sort by best seller > trending > featured > rest
                return products.stream()
                        .sorted(Comparator.comparingInt(this::getPopularityScore).reversed())
                        .collect(Collectors.toList());
            case "newest":
                return products.stream()
                        .sorted(Comparator.comparing(Product::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                        .collect(Collectors.toList());
            case "price_asc":
                return products.stream()
                        .sorted(Comparator.comparing(this::getEffectivePrice))
                        .collect(Collectors.toList());
            case "price_desc":
                return products.stream()
                        .sorted(Comparator.comparing(this::getEffectivePrice).reversed())
                        .collect(Collectors.toList());
            case "featured":
                return products.stream()
                        .sorted(Comparator.comparing(
                                (Product p) -> Boolean.TRUE.equals(p.getIsFeatured()) ? 0 : 1))
                        .collect(Collectors.toList());
            default:
                return products;
        }
    }

    private int getPopularityScore(Product product) {
        int score = 0;
        if (Boolean.TRUE.equals(product.getIsBestSeller())) score += 4;
        if (Boolean.TRUE.equals(product.getIsTrending())) score += 3;
        if (Boolean.TRUE.equals(product.getIsFeatured())) score += 2;
        if (Boolean.TRUE.equals(product.getIsNewArrival())) score += 1;
        return score;
    }

    private BigDecimal getEffectivePrice(Product product) {
        return product.getOfferPrice() != null ? product.getOfferPrice() : product.getBasePrice();
    }

    @Transactional
    private void saveRecentSearch(Long userId, String query) {
        // Check if search already exists, update timestamp if so
        Optional<RecentSearch> existing = recentSearchRepository.findByUserIdAndQuery(userId, query);
        if (existing.isPresent()) {
            existing.get().setSearchedAt(java.time.LocalDateTime.now());
            recentSearchRepository.save(existing.get());
            return;
        }

        // Check count and remove oldest if at limit
        long count = recentSearchRepository.countByUserId(userId);
        if (count >= MAX_RECENT_SEARCHES) {
            List<RecentSearch> searches = recentSearchRepository.findByUserIdOrderBySearchedAtDesc(userId);
            if (searches.size() >= MAX_RECENT_SEARCHES) {
                // Delete the oldest one
                RecentSearch oldest = searches.get(searches.size() - 1);
                recentSearchRepository.delete(oldest);
            }
        }

        // Save new search
        RecentSearch recentSearch = new RecentSearch(userId, query);
        recentSearchRepository.save(recentSearch);
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Long) {
            return (Long) authentication.getPrincipal();
        }
        return null;
    }

    private ProductResponse mapToProductResponse(Product product) {
        String categoryName = null;
        if (product.getCategoryId() != null) {
            categoryName = categoryRepository.findById(product.getCategoryId())
                    .map(Category::getName).orElse(null);
        }

        String subCategoryName = null;
        if (product.getSubCategoryId() != null) {
            subCategoryName = subCategoryRepository.findById(product.getSubCategoryId())
                    .map(SubCategory::getName).orElse(null);
        }

        String collectionName = null;
        if (product.getCollectionId() != null) {
            collectionName = collectionRepository.findById(product.getCollectionId())
                    .map(com.glydecurtains.entity.Collection::getName).orElse(null);
        }

        // Get thumbnail image
        String thumbnailBase64 = null;
        if (product.getImages() != null && !product.getImages().isEmpty()) {
            thumbnailBase64 = product.getImages().stream()
                    .filter(img -> Boolean.TRUE.equals(img.getIsThumbnail()))
                    .findFirst()
                    .map(ProductImage::getBase64Data)
                    .orElseGet(() -> product.getImages().get(0).getBase64Data());
        }

        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .sku(product.getSku())
                .barcode(product.getBarcode())
                .shortDescription(product.getShortDescription())
                .categoryId(product.getCategoryId())
                .categoryName(categoryName)
                .subCategoryId(product.getSubCategoryId())
                .subCategoryName(subCategoryName)
                .collectionId(product.getCollectionId())
                .collectionName(collectionName)
                .brand(product.getBrand())
                .material(product.getMaterial())
                .pattern(product.getPattern())
                .colors(fromJson(product.getColors()))
                .sizes(fromJson(product.getSizes()))
                .stockQuantity(product.getStockQuantity())
                .basePrice(product.getBasePrice())
                .discountPercentage(product.getDiscountPercentage())
                .offerPrice(product.getOfferPrice())
                .status(product.getStatus())
                .isFeatured(product.getIsFeatured())
                .isTrending(product.getIsTrending())
                .isNewArrival(product.getIsNewArrival())
                .isBestSeller(product.getIsBestSeller())
                .isPremium(product.getIsPremium())
                .tags(fromJson(product.getTags()))
                .thumbnailBase64(thumbnailBase64)
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }

    private List<String> fromJson(String json) {
        if (json == null || json.isBlank()) return Collections.emptyList();
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (JsonProcessingException e) {
            return Collections.emptyList();
        }
    }

    // Inner class for scored product sorting
    private static class ScoredProduct {
        private final Product product;
        private final int score;

        ScoredProduct(Product product, int score) {
            this.product = product;
            this.score = score;
        }

        Product getProduct() {
            return product;
        }

        int getScore() {
            return score;
        }
    }
}
