package com.glydecurtains.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.glydecurtains.dto.request.ProductCreateRequest;
import com.glydecurtains.dto.request.ProductFilterRequest;
import com.glydecurtains.dto.request.ProductUpdateRequest;
import com.glydecurtains.dto.response.ProductResponse;
import com.glydecurtains.entity.Category;
import com.glydecurtains.entity.Product;
import com.glydecurtains.entity.enums.ProductStatus;
import com.glydecurtains.exception.BusinessException;
import com.glydecurtains.repository.*;
import com.glydecurtains.service.impl.ProductServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductSpecificationRepository specificationRepository;

    @Mock
    private ProductVariantRepository variantRepository;

    @Mock
    private ProductImageRepository imageRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private SubCategoryRepository subCategoryRepository;

    @Mock
    private CollectionRepository collectionRepository;

    @Mock
    private TranslationService translationService;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private ProductServiceImpl productService;

    private Product sampleProduct;
    private Category sampleCategory;

    @BeforeEach
    void setUp() {
        sampleCategory = new Category();
        sampleCategory.setId(1L);
        sampleCategory.setName("Curtains");
        sampleCategory.setIsActive(true);

        sampleProduct = new Product();
        sampleProduct.setId(1L);
        sampleProduct.setName("Premium Silk Curtain");
        sampleProduct.setSku("PSC-001");
        sampleProduct.setCategoryId(1L);
        sampleProduct.setStockQuantity(50);
        sampleProduct.setBasePrice(new BigDecimal("1999.99"));
        sampleProduct.setDiscountPercentage(BigDecimal.ZERO);
        sampleProduct.setOfferPrice(new BigDecimal("1999.99"));
        sampleProduct.setStatus(ProductStatus.ACTIVE);
        sampleProduct.setIsFeatured(false);
        sampleProduct.setIsTrending(false);
        sampleProduct.setIsNewArrival(false);
        sampleProduct.setIsBestSeller(false);
        sampleProduct.setIsPremium(false);
        sampleProduct.setImages(new ArrayList<>());
        sampleProduct.setSpecifications(new ArrayList<>());
        sampleProduct.setVariants(new ArrayList<>());
    }

    @Nested
    @DisplayName("Create Product")
    class CreateProductTests {

        @Test
        @DisplayName("should create product successfully with valid request")
        void createProduct_withValidRequest_shouldReturnProductResponse() {
            ProductCreateRequest request = ProductCreateRequest.builder()
                    .name("New Curtain")
                    .sku("NC-001")
                    .categoryId(1L)
                    .stockQuantity(100)
                    .basePrice(new BigDecimal("599.99"))
                    .build();

            when(productRepository.existsBySku("NC-001")).thenReturn(false);
            when(categoryRepository.findById(1L)).thenReturn(Optional.of(sampleCategory));
            when(productRepository.save(any(Product.class))).thenAnswer(invocation -> {
                Product saved = invocation.getArgument(0);
                saved.setId(2L);
                return saved;
            });

            ProductResponse result = productService.createProduct(request);

            assertThat(result).isNotNull();
            assertThat(result.getName()).isEqualTo("New Curtain");
            assertThat(result.getSku()).isEqualTo("NC-001");
            verify(productRepository).save(any(Product.class));
        }

        @Test
        @DisplayName("should reject product creation with duplicate SKU")
        void createProduct_withDuplicateSku_shouldThrowBusinessException() {
            ProductCreateRequest request = ProductCreateRequest.builder()
                    .name("Duplicate Product")
                    .sku("PSC-001")
                    .categoryId(1L)
                    .stockQuantity(10)
                    .basePrice(new BigDecimal("299.99"))
                    .build();

            when(productRepository.existsBySku("PSC-001")).thenReturn(true);

            assertThatThrownBy(() -> productService.createProduct(request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("PSC-001")
                    .hasMessageContaining("already exists");

            verify(productRepository, never()).save(any(Product.class));
        }

        @Test
        @DisplayName("should reject product creation with non-existent category")
        void createProduct_withNonExistentCategory_shouldThrowBusinessException() {
            ProductCreateRequest request = ProductCreateRequest.builder()
                    .name("Curtain")
                    .sku("CUR-001")
                    .categoryId(999L)
                    .stockQuantity(10)
                    .basePrice(new BigDecimal("199.99"))
                    .build();

            when(productRepository.existsBySku("CUR-001")).thenReturn(false);
            when(categoryRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> productService.createProduct(request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Category not found");

            verify(productRepository, never()).save(any(Product.class));
        }
    }

    @Nested
    @DisplayName("Update Product")
    class UpdateProductTests {

        @Test
        @DisplayName("should update product successfully")
        void updateProduct_withValidRequest_shouldReturnUpdatedProduct() {
            ProductUpdateRequest request = ProductUpdateRequest.builder()
                    .name("Updated Curtain Name")
                    .basePrice(new BigDecimal("2499.99"))
                    .build();

            when(productRepository.findById(1L)).thenReturn(Optional.of(sampleProduct));
            when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

            ProductResponse result = productService.updateProduct(1L, request);

            assertThat(result).isNotNull();
            assertThat(result.getName()).isEqualTo("Updated Curtain Name");
            assertThat(result.getBasePrice()).isEqualByComparingTo(new BigDecimal("2499.99"));
            verify(productRepository).save(any(Product.class));
        }

        @Test
        @DisplayName("should reject update with duplicate SKU")
        void updateProduct_withDuplicateSku_shouldThrowBusinessException() {
            ProductUpdateRequest request = ProductUpdateRequest.builder()
                    .sku("EXISTING-SKU")
                    .build();

            when(productRepository.findById(1L)).thenReturn(Optional.of(sampleProduct));
            when(productRepository.existsBySkuAndIdNot("EXISTING-SKU", 1L)).thenReturn(true);

            assertThatThrownBy(() -> productService.updateProduct(1L, request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("EXISTING-SKU")
                    .hasMessageContaining("already exists");

            verify(productRepository, never()).save(any(Product.class));
        }
    }

    @Nested
    @DisplayName("Delete Product")
    class DeleteProductTests {

        @Test
        @DisplayName("should delete product and clean up translations")
        void deleteProduct_existingProduct_shouldDeleteAndCleanTranslations() {
            when(productRepository.findById(1L)).thenReturn(Optional.of(sampleProduct));

            productService.deleteProduct(1L);

            verify(translationService).deleteTranslations("PRODUCT", 1L);
            verify(productRepository).delete(sampleProduct);
        }

        @Test
        @DisplayName("should throw exception when deleting non-existent product")
        void deleteProduct_nonExistent_shouldThrowBusinessException() {
            when(productRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> productService.deleteProduct(99L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Product not found");

            verify(productRepository, never()).delete(any(Product.class));
        }
    }

    @Nested
    @DisplayName("Archive Product")
    class ArchiveProductTests {

        @Test
        @DisplayName("should archive product by setting status to ARCHIVED")
        void archiveProduct_existingProduct_shouldSetStatusArchived() {
            when(productRepository.findById(1L)).thenReturn(Optional.of(sampleProduct));
            when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

            ProductResponse result = productService.archiveProduct(1L);

            assertThat(result).isNotNull();
            assertThat(result.getStatus()).isEqualTo(ProductStatus.ARCHIVED);
            verify(productRepository).save(any(Product.class));
        }
    }

    @Nested
    @DisplayName("Activate Product")
    class ActivateProductTests {

        @Test
        @DisplayName("should activate product by setting status to ACTIVE")
        void activateProduct_existingProduct_shouldSetStatusActive() {
            sampleProduct.setStatus(ProductStatus.ARCHIVED);

            when(productRepository.findById(1L)).thenReturn(Optional.of(sampleProduct));
            when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

            ProductResponse result = productService.activateProduct(1L);

            assertThat(result).isNotNull();
            assertThat(result.getStatus()).isEqualTo(ProductStatus.ACTIVE);
            verify(productRepository).save(any(Product.class));
        }
    }

    @Nested
    @DisplayName("Deactivate Product")
    class DeactivateProductTests {

        @Test
        @DisplayName("should deactivate product by setting status to DEACTIVATED")
        void deactivateProduct_existingProduct_shouldSetStatusDeactivated() {
            when(productRepository.findById(1L)).thenReturn(Optional.of(sampleProduct));
            when(productRepository.save(any(Product.class))).thenAnswer(invocation -> invocation.getArgument(0));

            ProductResponse result = productService.deactivateProduct(1L);

            assertThat(result).isNotNull();
            assertThat(result.getStatus()).isEqualTo(ProductStatus.DEACTIVATED);
            verify(productRepository).save(any(Product.class));
        }
    }

    @Nested
    @DisplayName("Filter Products by Category")
    class FilterByCategoryTests {

        @Test
        @DisplayName("should filter products by category ID")
        void getProducts_withCategoryFilter_shouldReturnFilteredProducts() {
            ProductFilterRequest filter = ProductFilterRequest.builder()
                    .categoryId(1L)
                    .build();
            Pageable pageable = PageRequest.of(0, 10);

            Page<Product> productPage = new PageImpl<>(List.of(sampleProduct), pageable, 1);
            when(productRepository.findByCategoryId(1L, pageable)).thenReturn(productPage);

            var result = productService.getProducts(filter, pageable);

            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getCategoryId()).isEqualTo(1L);
            verify(productRepository).findByCategoryId(1L, pageable);
        }
    }

    @Nested
    @DisplayName("Filter Products by Status")
    class FilterByStatusTests {

        @Test
        @DisplayName("should filter products by status")
        void getProducts_withStatusFilter_shouldReturnFilteredProducts() {
            ProductFilterRequest filter = ProductFilterRequest.builder()
                    .status(ProductStatus.ACTIVE)
                    .build();
            Pageable pageable = PageRequest.of(0, 10);

            Page<Product> productPage = new PageImpl<>(List.of(sampleProduct), pageable, 1);
            when(productRepository.findByStatus(ProductStatus.ACTIVE, pageable)).thenReturn(productPage);

            var result = productService.getProducts(filter, pageable);

            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getStatus()).isEqualTo(ProductStatus.ACTIVE);
            verify(productRepository).findByStatus(ProductStatus.ACTIVE, pageable);
        }
    }
}
