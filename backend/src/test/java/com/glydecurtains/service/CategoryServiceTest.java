package com.glydecurtains.service;

import com.glydecurtains.dto.request.CategoryCreateRequest;
import com.glydecurtains.dto.response.CategoryResponse;
import com.glydecurtains.entity.Category;
import com.glydecurtains.entity.Product;
import com.glydecurtains.exception.BusinessException;
import com.glydecurtains.repository.CategoryRepository;
import com.glydecurtains.repository.CollectionRepository;
import com.glydecurtains.repository.ProductRepository;
import com.glydecurtains.repository.SubCategoryRepository;
import com.glydecurtains.service.impl.CategoryServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @Mock
    private SubCategoryRepository subCategoryRepository;

    @Mock
    private CollectionRepository collectionRepository;

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private CategoryServiceImpl categoryService;

    private Category sampleCategory;

    @BeforeEach
    void setUp() {
        sampleCategory = new Category();
        sampleCategory.setId(1L);
        sampleCategory.setName("Curtains");
        sampleCategory.setDescription("All types of curtains");
        sampleCategory.setIconBase64("icon-base64-data");
        sampleCategory.setImageBase64("image-base64-data");
        sampleCategory.setSortOrder(1);
        sampleCategory.setIsVisible(true);
        sampleCategory.setIsActive(true);
    }

    @Nested
    @DisplayName("Create Category")
    class CreateCategoryTests {

        @Test
        @DisplayName("should create category successfully with valid request")
        void createCategory_withValidRequest_shouldReturnCategoryResponse() {
            CategoryCreateRequest request = CategoryCreateRequest.builder()
                    .name("Blinds")
                    .description("Window blinds")
                    .iconBase64("icon-data")
                    .imageBase64("image-data")
                    .sortOrder(2)
                    .build();

            Category savedCategory = new Category();
            savedCategory.setId(2L);
            savedCategory.setName("Blinds");
            savedCategory.setDescription("Window blinds");
            savedCategory.setIconBase64("icon-data");
            savedCategory.setImageBase64("image-data");
            savedCategory.setSortOrder(2);
            savedCategory.setIsVisible(true);
            savedCategory.setIsActive(true);

            when(categoryRepository.findByNameIgnoreCase("Blinds")).thenReturn(Optional.empty());
            when(categoryRepository.save(any(Category.class))).thenReturn(savedCategory);

            CategoryResponse result = categoryService.createCategory(request);

            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo(2L);
            assertThat(result.getName()).isEqualTo("Blinds");
            assertThat(result.getDescription()).isEqualTo("Window blinds");
            assertThat(result.getSortOrder()).isEqualTo(2);
            assertThat(result.getIsVisible()).isTrue();
            assertThat(result.getIsActive()).isTrue();

            verify(categoryRepository).findByNameIgnoreCase("Blinds");
            verify(categoryRepository).save(any(Category.class));
        }

        @Test
        @DisplayName("should default sortOrder to 0 when not provided")
        void createCategory_withNullSortOrder_shouldDefaultToZero() {
            CategoryCreateRequest request = CategoryCreateRequest.builder()
                    .name("Accessories")
                    .description("Curtain accessories")
                    .build();

            Category savedCategory = new Category();
            savedCategory.setId(3L);
            savedCategory.setName("Accessories");
            savedCategory.setDescription("Curtain accessories");
            savedCategory.setSortOrder(0);
            savedCategory.setIsVisible(true);
            savedCategory.setIsActive(true);

            when(categoryRepository.findByNameIgnoreCase("Accessories")).thenReturn(Optional.empty());
            when(categoryRepository.save(any(Category.class))).thenReturn(savedCategory);

            CategoryResponse result = categoryService.createCategory(request);

            assertThat(result.getSortOrder()).isEqualTo(0);
        }
    }

    @Nested
    @DisplayName("Create Category with Duplicate Name")
    class CreateCategoryDuplicateNameTests {

        @Test
        @DisplayName("should throw BusinessException when category name already exists")
        void createCategory_withDuplicateName_shouldThrowBusinessException() {
            CategoryCreateRequest request = CategoryCreateRequest.builder()
                    .name("Curtains")
                    .description("Duplicate category")
                    .build();

            when(categoryRepository.findByNameIgnoreCase("Curtains")).thenReturn(Optional.of(sampleCategory));

            assertThatThrownBy(() -> categoryService.createCategory(request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("already exists")
                    .extracting("errorCode")
                    .isEqualTo("CATEGORY_DUPLICATE_NAME");

            verify(categoryRepository).findByNameIgnoreCase("Curtains");
            verify(categoryRepository, never()).save(any(Category.class));
        }

        @Test
        @DisplayName("should throw BusinessException with CONFLICT status for duplicate name")
        void createCategory_withDuplicateName_shouldReturnConflictStatus() {
            CategoryCreateRequest request = CategoryCreateRequest.builder()
                    .name("curtains") // case-insensitive match
                    .build();

            when(categoryRepository.findByNameIgnoreCase("curtains")).thenReturn(Optional.of(sampleCategory));

            assertThatThrownBy(() -> categoryService.createCategory(request))
                    .isInstanceOf(BusinessException.class)
                    .extracting("httpStatus")
                    .isEqualTo(HttpStatus.CONFLICT);
        }
    }

    @Nested
    @DisplayName("Delete Category")
    class DeleteCategoryTests {

        @Test
        @DisplayName("should throw BusinessException when category has associated products")
        void deleteCategory_withAssociatedProducts_shouldThrowBusinessException() {
            Product product = new Product();
            product.setId(1L);
            product.setName("Test Product");

            when(categoryRepository.findById(1L)).thenReturn(Optional.of(sampleCategory));
            when(productRepository.findByCategoryId(1L)).thenReturn(List.of(product));

            assertThatThrownBy(() -> categoryService.deleteCategory(1L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Cannot delete category")
                    .hasMessageContaining("associated product(s)")
                    .extracting("errorCode")
                    .isEqualTo("CATEGORY_IN_USE");

            verify(categoryRepository, never()).delete(any(Category.class));
        }

        @Test
        @DisplayName("should delete category successfully when no products associated")
        void deleteCategory_withNoProducts_shouldDeleteSuccessfully() {
            when(categoryRepository.findById(1L)).thenReturn(Optional.of(sampleCategory));
            when(productRepository.findByCategoryId(1L)).thenReturn(Collections.emptyList());
            when(subCategoryRepository.findByCategoryId(1L)).thenReturn(Collections.emptyList());

            categoryService.deleteCategory(1L);

            verify(categoryRepository).delete(sampleCategory);
        }

        @Test
        @DisplayName("should throw BusinessException when category not found")
        void deleteCategory_whenNotFound_shouldThrowBusinessException() {
            when(categoryRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> categoryService.deleteCategory(99L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Category not found")
                    .extracting("errorCode")
                    .isEqualTo("CATEGORY_NOT_FOUND");
        }
    }

    @Nested
    @DisplayName("Reorder Categories (Update Sort Order)")
    class ReorderCategoriesTests {

        @Test
        @DisplayName("should update sort order for a category")
        void updateSortOrder_shouldUpdateAndReturnCategory() {
            Category updatedCategory = new Category();
            updatedCategory.setId(1L);
            updatedCategory.setName("Curtains");
            updatedCategory.setDescription("All types of curtains");
            updatedCategory.setSortOrder(5);
            updatedCategory.setIsVisible(true);
            updatedCategory.setIsActive(true);

            when(categoryRepository.findById(1L)).thenReturn(Optional.of(sampleCategory));
            when(categoryRepository.save(any(Category.class))).thenReturn(updatedCategory);

            CategoryResponse result = categoryService.updateSortOrder(1L, 5);

            assertThat(result).isNotNull();
            assertThat(result.getSortOrder()).isEqualTo(5);

            verify(categoryRepository).findById(1L);
            verify(categoryRepository).save(any(Category.class));
        }

        @Test
        @DisplayName("should throw BusinessException when reordering non-existent category")
        void updateSortOrder_whenCategoryNotFound_shouldThrowBusinessException() {
            when(categoryRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> categoryService.updateSortOrder(99L, 3))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Category not found")
                    .extracting("errorCode")
                    .isEqualTo("CATEGORY_NOT_FOUND");
        }
    }

    @Nested
    @DisplayName("Toggle Visibility")
    class ToggleVisibilityTests {

        @Test
        @DisplayName("should set visibility to false")
        void toggleVisibility_toHidden_shouldUpdateAndReturn() {
            Category hiddenCategory = new Category();
            hiddenCategory.setId(1L);
            hiddenCategory.setName("Curtains");
            hiddenCategory.setDescription("All types of curtains");
            hiddenCategory.setSortOrder(1);
            hiddenCategory.setIsVisible(false);
            hiddenCategory.setIsActive(true);

            when(categoryRepository.findById(1L)).thenReturn(Optional.of(sampleCategory));
            when(categoryRepository.save(any(Category.class))).thenReturn(hiddenCategory);

            CategoryResponse result = categoryService.toggleVisibility(1L, false);

            assertThat(result).isNotNull();
            assertThat(result.getIsVisible()).isFalse();

            verify(categoryRepository).findById(1L);
            verify(categoryRepository).save(any(Category.class));
        }

        @Test
        @DisplayName("should set visibility to true")
        void toggleVisibility_toVisible_shouldUpdateAndReturn() {
            sampleCategory.setIsVisible(false); // start as hidden

            Category visibleCategory = new Category();
            visibleCategory.setId(1L);
            visibleCategory.setName("Curtains");
            visibleCategory.setSortOrder(1);
            visibleCategory.setIsVisible(true);
            visibleCategory.setIsActive(true);

            when(categoryRepository.findById(1L)).thenReturn(Optional.of(sampleCategory));
            when(categoryRepository.save(any(Category.class))).thenReturn(visibleCategory);

            CategoryResponse result = categoryService.toggleVisibility(1L, true);

            assertThat(result).isNotNull();
            assertThat(result.getIsVisible()).isTrue();
        }

        @Test
        @DisplayName("should throw BusinessException when toggling non-existent category")
        void toggleVisibility_whenCategoryNotFound_shouldThrowBusinessException() {
            when(categoryRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> categoryService.toggleVisibility(99L, true))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Category not found")
                    .extracting("errorCode")
                    .isEqualTo("CATEGORY_NOT_FOUND");
        }
    }
}
