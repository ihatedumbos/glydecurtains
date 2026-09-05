package com.glydecurtains.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.glydecurtains.dto.request.SearchRequest;
import com.glydecurtains.dto.response.PageResponse;
import com.glydecurtains.dto.response.ProductResponse;
import com.glydecurtains.entity.Product;
import com.glydecurtains.entity.RecentSearch;
import com.glydecurtains.entity.TranslatedContent;
import com.glydecurtains.entity.enums.ProductStatus;
import com.glydecurtains.repository.*;
import com.glydecurtains.service.impl.SearchServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SearchServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private SubCategoryRepository subCategoryRepository;

    @Mock
    private CollectionRepository collectionRepository;

    @Mock
    private TranslatedContentRepository translatedContentRepository;

    @Mock
    private RecentSearchRepository recentSearchRepository;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private SearchServiceImpl searchService;

    private Product curtainProduct;
    private Product blindProduct;
    private Product premiumCurtainProduct;

    @BeforeEach
    void setUp() {
        curtainProduct = createProduct(1L, "Velvet Curtain", "SKU-001", "Luxury Brand",
                "velvet", "Elegant velvet curtain for living room", 1L, null, null,
                new BigDecimal("49.99"), null, 10, ProductStatus.ACTIVE);

        blindProduct = createProduct(2L, "Wooden Blind", "SKU-002", "Home Decor",
                "wood", "Natural wooden blind for windows", 2L, null, null,
                new BigDecimal("29.99"), null, 5, ProductStatus.ACTIVE);

        premiumCurtainProduct = createProduct(3L, "Premium Silk Curtain", "SKU-003", "Luxury Brand",
                "silk", "Premium silk curtain with gold trim", 1L, 10L, null,
                new BigDecimal("199.99"), new BigDecimal("149.99"), 3, ProductStatus.ACTIVE);
    }

    @Nested
    @DisplayName("Search by keyword")
    class SearchByKeyword {

        @Test
        @DisplayName("Should return products matching keyword in name")
        void shouldReturnProductsMatchingKeywordInName() throws JsonProcessingException {
            SearchRequest request = SearchRequest.builder()
                    .query("Curtain")
                    .build();
            Pageable pageable = PageRequest.of(0, 10);

            when(productRepository.findByStatus(ProductStatus.ACTIVE))
                    .thenReturn(List.of(curtainProduct, blindProduct, premiumCurtainProduct));
            when(translatedContentRepository.findAll()).thenReturn(Collections.emptyList());

            setupUnauthenticatedContext();

            PageResponse<ProductResponse> result = searchService.search(request, pageable);

            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(2);
            assertThat(result.getContent()).extracting(ProductResponse::getName)
                    .containsExactlyInAnyOrder("Velvet Curtain", "Premium Silk Curtain");
            assertThat(result.getTotalElements()).isEqualTo(2);
        }

        @Test
        @DisplayName("Should return products matching keyword in brand")
        void shouldReturnProductsMatchingKeywordInBrand() throws JsonProcessingException {
            SearchRequest request = SearchRequest.builder()
                    .query("Luxury Brand")
                    .build();
            Pageable pageable = PageRequest.of(0, 10);

            when(productRepository.findByStatus(ProductStatus.ACTIVE))
                    .thenReturn(List.of(curtainProduct, blindProduct, premiumCurtainProduct));
            when(translatedContentRepository.findAll()).thenReturn(Collections.emptyList());

            setupUnauthenticatedContext();

            PageResponse<ProductResponse> result = searchService.search(request, pageable);

            assertThat(result).isNotNull();
            assertThat(result.getContent()).extracting(ProductResponse::getName)
                    .contains("Velvet Curtain", "Premium Silk Curtain");
        }

        @Test
        @DisplayName("Should return products matching keyword in material")
        void shouldReturnProductsMatchingKeywordInMaterial() throws JsonProcessingException {
            SearchRequest request = SearchRequest.builder()
                    .query("velvet")
                    .build();
            Pageable pageable = PageRequest.of(0, 10);

            when(productRepository.findByStatus(ProductStatus.ACTIVE))
                    .thenReturn(List.of(curtainProduct, blindProduct, premiumCurtainProduct));
            when(translatedContentRepository.findAll()).thenReturn(Collections.emptyList());

            setupUnauthenticatedContext();

            PageResponse<ProductResponse> result = searchService.search(request, pageable);

            assertThat(result).isNotNull();
            assertThat(result.getContent()).isNotEmpty();
            assertThat(result.getContent()).extracting(ProductResponse::getName)
                    .contains("Velvet Curtain");
        }

        @Test
        @DisplayName("Should return all active products when query is null")
        void shouldReturnAllActiveProductsWhenQueryIsNull() throws JsonProcessingException {
            SearchRequest request = SearchRequest.builder().build();
            Pageable pageable = PageRequest.of(0, 10);

            when(productRepository.findByStatus(ProductStatus.ACTIVE))
                    .thenReturn(List.of(curtainProduct, blindProduct, premiumCurtainProduct));

            setupUnauthenticatedContext();

            PageResponse<ProductResponse> result = searchService.search(request, pageable);

            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(3);
            assertThat(result.getTotalElements()).isEqualTo(3);
        }
    }

    @Nested
    @DisplayName("Search with filters")
    class SearchWithFilters {

        @Test
        @DisplayName("Should filter products by category")
        void shouldFilterProductsByCategory() throws JsonProcessingException {
            SearchRequest request = SearchRequest.builder()
                    .categoryId(1L)
                    .build();
            Pageable pageable = PageRequest.of(0, 10);

            when(productRepository.findByStatus(ProductStatus.ACTIVE))
                    .thenReturn(List.of(curtainProduct, blindProduct, premiumCurtainProduct));

            setupUnauthenticatedContext();

            PageResponse<ProductResponse> result = searchService.search(request, pageable);

            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(2);
            assertThat(result.getContent()).extracting(ProductResponse::getCategoryId)
                    .containsOnly(1L);
        }

        @Test
        @DisplayName("Should filter products by material")
        void shouldFilterProductsByMaterial() throws JsonProcessingException {
            SearchRequest request = SearchRequest.builder()
                    .material("silk")
                    .build();
            Pageable pageable = PageRequest.of(0, 10);

            when(productRepository.findByStatus(ProductStatus.ACTIVE))
                    .thenReturn(List.of(curtainProduct, blindProduct, premiumCurtainProduct));

            setupUnauthenticatedContext();

            PageResponse<ProductResponse> result = searchService.search(request, pageable);

            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getName()).isEqualTo("Premium Silk Curtain");
        }

        @Test
        @DisplayName("Should filter products by price range")
        void shouldFilterProductsByPriceRange() throws JsonProcessingException {
            SearchRequest request = SearchRequest.builder()
                    .minPrice(new BigDecimal("30.00"))
                    .maxPrice(new BigDecimal("100.00"))
                    .build();
            Pageable pageable = PageRequest.of(0, 10);

            when(productRepository.findByStatus(ProductStatus.ACTIVE))
                    .thenReturn(List.of(curtainProduct, blindProduct, premiumCurtainProduct));

            setupUnauthenticatedContext();

            PageResponse<ProductResponse> result = searchService.search(request, pageable);

            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getName()).isEqualTo("Velvet Curtain");
        }

        @Test
        @DisplayName("Should filter products by availability (in stock)")
        void shouldFilterProductsByAvailability() throws JsonProcessingException {
            Product outOfStockProduct = createProduct(4L, "Out of Stock Curtain", "SKU-004",
                    "Brand", "cotton", "Description", 1L, null, null,
                    new BigDecimal("39.99"), null, 0, ProductStatus.ACTIVE);

            SearchRequest request = SearchRequest.builder()
                    .inStock(true)
                    .build();
            Pageable pageable = PageRequest.of(0, 10);

            when(productRepository.findByStatus(ProductStatus.ACTIVE))
                    .thenReturn(List.of(curtainProduct, blindProduct, outOfStockProduct));

            setupUnauthenticatedContext();

            PageResponse<ProductResponse> result = searchService.search(request, pageable);

            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(2);
            assertThat(result.getContent()).extracting(ProductResponse::getName)
                    .doesNotContain("Out of Stock Curtain");
        }

        @Test
        @DisplayName("Should combine keyword search with filters")
        void shouldCombineKeywordSearchWithFilters() throws JsonProcessingException {
            SearchRequest request = SearchRequest.builder()
                    .query("Curtain")
                    .categoryId(1L)
                    .minPrice(new BigDecimal("100.00"))
                    .build();
            Pageable pageable = PageRequest.of(0, 10);

            when(productRepository.findByStatus(ProductStatus.ACTIVE))
                    .thenReturn(List.of(curtainProduct, blindProduct, premiumCurtainProduct));
            when(translatedContentRepository.findAll()).thenReturn(Collections.emptyList());

            setupUnauthenticatedContext();

            PageResponse<ProductResponse> result = searchService.search(request, pageable);

            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getName()).isEqualTo("Premium Silk Curtain");
        }
    }

    @Nested
    @DisplayName("Search with empty results")
    class SearchEmptyResults {

        @Test
        @DisplayName("Should return empty results when no products match keyword")
        void shouldReturnEmptyResultsWhenNoProductsMatchKeyword() throws JsonProcessingException {
            SearchRequest request = SearchRequest.builder()
                    .query("nonexistent-product-xyz")
                    .build();
            Pageable pageable = PageRequest.of(0, 10);

            when(productRepository.findByStatus(ProductStatus.ACTIVE))
                    .thenReturn(List.of(curtainProduct, blindProduct, premiumCurtainProduct));
            when(translatedContentRepository.findAll()).thenReturn(Collections.emptyList());

            setupUnauthenticatedContext();

            PageResponse<ProductResponse> result = searchService.search(request, pageable);

            assertThat(result).isNotNull();
            assertThat(result.getContent()).isEmpty();
            assertThat(result.getTotalElements()).isEqualTo(0);
        }

        @Test
        @DisplayName("Should return empty results when no active products exist")
        void shouldReturnEmptyResultsWhenNoActiveProductsExist() {
            SearchRequest request = SearchRequest.builder()
                    .query("Curtain")
                    .build();
            Pageable pageable = PageRequest.of(0, 10);

            when(productRepository.findByStatus(ProductStatus.ACTIVE))
                    .thenReturn(Collections.emptyList());
            when(translatedContentRepository.findAll()).thenReturn(Collections.emptyList());

            setupUnauthenticatedContext();

            PageResponse<ProductResponse> result = searchService.search(request, pageable);

            assertThat(result).isNotNull();
            assertThat(result.getContent()).isEmpty();
            assertThat(result.getTotalElements()).isEqualTo(0);
        }

        @Test
        @DisplayName("Should return empty results when filters exclude all products")
        void shouldReturnEmptyResultsWhenFiltersExcludeAllProducts() throws JsonProcessingException {
            SearchRequest request = SearchRequest.builder()
                    .minPrice(new BigDecimal("500.00"))
                    .build();
            Pageable pageable = PageRequest.of(0, 10);

            when(productRepository.findByStatus(ProductStatus.ACTIVE))
                    .thenReturn(List.of(curtainProduct, blindProduct, premiumCurtainProduct));

            setupUnauthenticatedContext();

            PageResponse<ProductResponse> result = searchService.search(request, pageable);

            assertThat(result).isNotNull();
            assertThat(result.getContent()).isEmpty();
            assertThat(result.getTotalElements()).isEqualTo(0);
        }
    }

    @Nested
    @DisplayName("Search with pagination")
    class SearchWithPagination {

        @Test
        @DisplayName("Should return first page of results")
        void shouldReturnFirstPageOfResults() throws JsonProcessingException {
            SearchRequest request = SearchRequest.builder().build();
            Pageable pageable = PageRequest.of(0, 2);

            when(productRepository.findByStatus(ProductStatus.ACTIVE))
                    .thenReturn(List.of(curtainProduct, blindProduct, premiumCurtainProduct));

            setupUnauthenticatedContext();

            PageResponse<ProductResponse> result = searchService.search(request, pageable);

            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(2);
            assertThat(result.getPage()).isEqualTo(0);
            assertThat(result.getSize()).isEqualTo(2);
            assertThat(result.getTotalElements()).isEqualTo(3);
            assertThat(result.getTotalPages()).isEqualTo(2);
            assertThat(result.isLast()).isFalse();
        }

        @Test
        @DisplayName("Should return second page of results")
        void shouldReturnSecondPageOfResults() throws JsonProcessingException {
            SearchRequest request = SearchRequest.builder().build();
            Pageable pageable = PageRequest.of(1, 2);

            when(productRepository.findByStatus(ProductStatus.ACTIVE))
                    .thenReturn(List.of(curtainProduct, blindProduct, premiumCurtainProduct));

            setupUnauthenticatedContext();

            PageResponse<ProductResponse> result = searchService.search(request, pageable);

            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getPage()).isEqualTo(1);
            assertThat(result.getTotalElements()).isEqualTo(3);
            assertThat(result.isLast()).isTrue();
        }

        @Test
        @DisplayName("Should return empty content when page exceeds total pages")
        void shouldReturnEmptyContentWhenPageExceedsTotalPages() throws JsonProcessingException {
            SearchRequest request = SearchRequest.builder().build();
            Pageable pageable = PageRequest.of(5, 10);

            when(productRepository.findByStatus(ProductStatus.ACTIVE))
                    .thenReturn(List.of(curtainProduct, blindProduct, premiumCurtainProduct));

            setupUnauthenticatedContext();

            PageResponse<ProductResponse> result = searchService.search(request, pageable);

            assertThat(result).isNotNull();
            assertThat(result.getContent()).isEmpty();
            assertThat(result.getTotalElements()).isEqualTo(3);
        }

        @Test
        @DisplayName("Should correctly report pagination metadata")
        void shouldCorrectlyReportPaginationMetadata() throws JsonProcessingException {
            SearchRequest request = SearchRequest.builder().build();
            Pageable pageable = PageRequest.of(0, 1);

            when(productRepository.findByStatus(ProductStatus.ACTIVE))
                    .thenReturn(List.of(curtainProduct, blindProduct, premiumCurtainProduct));

            setupUnauthenticatedContext();

            PageResponse<ProductResponse> result = searchService.search(request, pageable);

            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getPage()).isEqualTo(0);
            assertThat(result.getSize()).isEqualTo(1);
            assertThat(result.getTotalElements()).isEqualTo(3);
            assertThat(result.getTotalPages()).isEqualTo(3);
            assertThat(result.isLast()).isFalse();
        }
    }

    // --- Helper methods ---

    private Product createProduct(Long id, String name, String sku, String brand,
                                  String material, String shortDescription,
                                  Long categoryId, Long subCategoryId, Long collectionId,
                                  BigDecimal basePrice, BigDecimal offerPrice,
                                  Integer stockQuantity, ProductStatus status) {
        Product product = new Product();
        product.setId(id);
        product.setName(name);
        product.setSku(sku);
        product.setBrand(brand);
        product.setMaterial(material);
        product.setShortDescription(shortDescription);
        product.setCategoryId(categoryId);
        product.setSubCategoryId(subCategoryId);
        product.setCollectionId(collectionId);
        product.setBasePrice(basePrice);
        product.setOfferPrice(offerPrice);
        product.setStockQuantity(stockQuantity);
        product.setStatus(status);
        product.setIsFeatured(false);
        product.setIsTrending(false);
        product.setIsNewArrival(false);
        product.setIsBestSeller(false);
        product.setIsPremium(false);
        product.setCreatedAt(LocalDateTime.now());
        product.setUpdatedAt(LocalDateTime.now());
        return product;
    }

    private void setupUnauthenticatedContext() {
        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getPrincipal()).thenReturn("anonymousUser");
        SecurityContextHolder.setContext(securityContext);
    }
}
