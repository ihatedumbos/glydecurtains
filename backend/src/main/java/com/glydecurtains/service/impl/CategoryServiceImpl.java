package com.glydecurtains.service.impl;

import com.glydecurtains.dto.request.*;
import com.glydecurtains.dto.response.CategoryResponse;
import com.glydecurtains.dto.response.CategoryTreeResponse;
import com.glydecurtains.dto.response.CollectionResponse;
import com.glydecurtains.dto.response.SubCategoryResponse;
import com.glydecurtains.entity.Category;
import com.glydecurtains.entity.Collection;
import com.glydecurtains.entity.SubCategory;
import com.glydecurtains.exception.BusinessException;
import com.glydecurtains.repository.CategoryRepository;
import com.glydecurtains.repository.CollectionRepository;
import com.glydecurtains.repository.ProductRepository;
import com.glydecurtains.repository.SubCategoryRepository;
import com.glydecurtains.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final SubCategoryRepository subCategoryRepository;
    private final CollectionRepository collectionRepository;
    private final ProductRepository productRepository;

    @Override
    public CategoryResponse createCategory(CategoryCreateRequest request) {
        // Check for duplicate name
        categoryRepository.findByNameIgnoreCase(request.getName())
                .ifPresent(existing -> {
                    throw new BusinessException(
                            "Category with name '" + request.getName() + "' already exists",
                            "CATEGORY_DUPLICATE_NAME",
                            HttpStatus.CONFLICT);
                });

        Category category = new Category();
        category.setName(request.getName());
        category.setDescription(request.getDescription());
        category.setIconBase64(request.getIconBase64());
        category.setImageBase64(request.getImageBase64());
        category.setSortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0);
        category.setIsVisible(true);
        category.setIsActive(true);

        Category saved = categoryRepository.save(category);
        return mapToCategoryResponse(saved);
    }

    @Override
    public CategoryResponse updateCategory(Long id, CategoryUpdateRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new BusinessException(
                        "Category not found with id: " + id,
                        "CATEGORY_NOT_FOUND",
                        HttpStatus.NOT_FOUND));

        // Check for duplicate name if name is being changed
        if (request.getName() != null && !request.getName().equalsIgnoreCase(category.getName())) {
            categoryRepository.findByNameIgnoreCase(request.getName())
                    .ifPresent(existing -> {
                        throw new BusinessException(
                                "Category with name '" + request.getName() + "' already exists",
                                "CATEGORY_DUPLICATE_NAME",
                                HttpStatus.CONFLICT);
                    });
            category.setName(request.getName());
        }

        if (request.getDescription() != null) {
            category.setDescription(request.getDescription());
        }
        if (request.getIconBase64() != null) {
            category.setIconBase64(request.getIconBase64());
        }
        if (request.getImageBase64() != null) {
            category.setImageBase64(request.getImageBase64());
        }

        Category saved = categoryRepository.save(category);
        return mapToCategoryResponse(saved);
    }

    @Override
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new BusinessException(
                        "Category not found with id: " + id,
                        "CATEGORY_NOT_FOUND",
                        HttpStatus.NOT_FOUND));

        // Prevent deletion if products are associated
        List<?> products = productRepository.findByCategoryId(id);
        if (!products.isEmpty()) {
            throw new BusinessException(
                    "Cannot delete category '" + category.getName() + "' because it has " + products.size() + " associated product(s)",
                    "CATEGORY_IN_USE",
                    HttpStatus.CONFLICT);
        }

        // Delete associated sub-categories first
        List<SubCategory> subCategories = subCategoryRepository.findByCategoryId(id);
        subCategoryRepository.deleteAll(subCategories);

        categoryRepository.delete(category);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryTreeResponse> getCategoryTree() {
        List<Category> categories = categoryRepository.findAllByOrderBySortOrderAsc();

        return categories.stream()
                .filter(Category::getIsActive)
                .filter(Category::getIsVisible)
                .map(category -> {
                    List<SubCategory> subCategories = subCategoryRepository.findByCategoryId(category.getId());
                    List<SubCategoryResponse> subCategoryResponses = subCategories.stream()
                            .filter(SubCategory::getIsActive)
                            .map(this::mapToSubCategoryResponse)
                            .collect(Collectors.toList());

                    return CategoryTreeResponse.builder()
                            .id(category.getId())
                            .name(category.getName())
                            .description(category.getDescription())
                            .iconBase64(category.getIconBase64())
                            .imageBase64(category.getImageBase64())
                            .sortOrder(category.getSortOrder())
                            .isVisible(category.getIsVisible())
                            .isActive(category.getIsActive())
                            .subCategories(subCategoryResponses)
                            .build();
                })
                .collect(Collectors.toList());
    }

    @Override
    public CategoryResponse updateSortOrder(Long id, int sortOrder) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new BusinessException(
                        "Category not found with id: " + id,
                        "CATEGORY_NOT_FOUND",
                        HttpStatus.NOT_FOUND));

        category.setSortOrder(sortOrder);
        Category saved = categoryRepository.save(category);
        return mapToCategoryResponse(saved);
    }

    @Override
    public CategoryResponse toggleVisibility(Long id, boolean visible) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new BusinessException(
                        "Category not found with id: " + id,
                        "CATEGORY_NOT_FOUND",
                        HttpStatus.NOT_FOUND));

        category.setIsVisible(visible);
        Category saved = categoryRepository.save(category);
        return mapToCategoryResponse(saved);
    }

    @Override
    public CategoryResponse toggleActive(Long id, boolean active) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new BusinessException(
                        "Category not found with id: " + id,
                        "CATEGORY_NOT_FOUND",
                        HttpStatus.NOT_FOUND));

        category.setIsActive(active);
        Category saved = categoryRepository.save(category);
        return mapToCategoryResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findAllByOrderBySortOrderAsc().stream()
                .map(this::mapToCategoryResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public CategoryResponse getCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new BusinessException(
                        "Category not found with id: " + id,
                        "CATEGORY_NOT_FOUND",
                        HttpStatus.NOT_FOUND));
        return mapToCategoryResponse(category);
    }

    @Override
    public SubCategoryResponse createSubCategory(Long categoryId, SubCategoryCreateRequest request) {
        // Verify parent category exists
        categoryRepository.findById(categoryId)
                .orElseThrow(() -> new BusinessException(
                        "Parent category not found with id: " + categoryId,
                        "CATEGORY_NOT_FOUND",
                        HttpStatus.NOT_FOUND));

        SubCategory subCategory = new SubCategory();
        subCategory.setName(request.getName());
        subCategory.setCategoryId(categoryId);
        subCategory.setSortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0);
        subCategory.setIsActive(true);

        SubCategory saved = subCategoryRepository.save(subCategory);
        return mapToSubCategoryResponse(saved);
    }

    @Override
    public SubCategoryResponse updateSubCategory(Long id, SubCategoryUpdateRequest request) {
        SubCategory subCategory = subCategoryRepository.findById(id)
                .orElseThrow(() -> new BusinessException(
                        "Sub-category not found with id: " + id,
                        "SUB_CATEGORY_NOT_FOUND",
                        HttpStatus.NOT_FOUND));

        if (request.getName() != null) {
            subCategory.setName(request.getName());
        }
        if (request.getSortOrder() != null) {
            subCategory.setSortOrder(request.getSortOrder());
        }
        if (request.getIsActive() != null) {
            subCategory.setIsActive(request.getIsActive());
        }

        SubCategory saved = subCategoryRepository.save(subCategory);
        return mapToSubCategoryResponse(saved);
    }

    @Override
    public void deleteSubCategory(Long id) {
        SubCategory subCategory = subCategoryRepository.findById(id)
                .orElseThrow(() -> new BusinessException(
                        "Sub-category not found with id: " + id,
                        "SUB_CATEGORY_NOT_FOUND",
                        HttpStatus.NOT_FOUND));

        // Check if products are using this sub-category
        List<?> products = productRepository.findBySubCategoryId(id);
        if (!products.isEmpty()) {
            throw new BusinessException(
                    "Cannot delete sub-category '" + subCategory.getName() + "' because it has " + products.size() + " associated product(s)",
                    "SUB_CATEGORY_IN_USE",
                    HttpStatus.CONFLICT);
        }

        subCategoryRepository.delete(subCategory);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SubCategoryResponse> getSubCategories(Long categoryId) {
        // Verify parent category exists
        categoryRepository.findById(categoryId)
                .orElseThrow(() -> new BusinessException(
                        "Category not found with id: " + categoryId,
                        "CATEGORY_NOT_FOUND",
                        HttpStatus.NOT_FOUND));

        return subCategoryRepository.findByCategoryIdOrderBySortOrderAsc(categoryId).stream()
                .map(this::mapToSubCategoryResponse)
                .collect(Collectors.toList());
    }

    @Override
    public CollectionResponse createCollection(CollectionCreateRequest request) {
        Collection collection = new Collection();
        collection.setName(request.getName());
        collection.setDescription(request.getDescription());
        collection.setImageBase64(request.getImageBase64());
        collection.setIsActive(true);

        Collection saved = collectionRepository.save(collection);
        return mapToCollectionResponse(saved);
    }

    @Override
    public CollectionResponse updateCollection(Long id, CollectionUpdateRequest request) {
        Collection collection = collectionRepository.findById(id)
                .orElseThrow(() -> new BusinessException(
                        "Collection not found with id: " + id,
                        "COLLECTION_NOT_FOUND",
                        HttpStatus.NOT_FOUND));

        if (request.getName() != null) {
            collection.setName(request.getName());
        }
        if (request.getDescription() != null) {
            collection.setDescription(request.getDescription());
        }
        if (request.getImageBase64() != null) {
            collection.setImageBase64(request.getImageBase64());
        }
        if (request.getIsActive() != null) {
            collection.setIsActive(request.getIsActive());
        }

        Collection saved = collectionRepository.save(collection);
        return mapToCollectionResponse(saved);
    }

    @Override
    public void deleteCollection(Long id) {
        Collection collection = collectionRepository.findById(id)
                .orElseThrow(() -> new BusinessException(
                        "Collection not found with id: " + id,
                        "COLLECTION_NOT_FOUND",
                        HttpStatus.NOT_FOUND));

        // Check if products are using this collection
        List<?> products = productRepository.findByCollectionId(id);
        if (!products.isEmpty()) {
            throw new BusinessException(
                    "Cannot delete collection '" + collection.getName() + "' because it has " + products.size() + " associated product(s)",
                    "COLLECTION_IN_USE",
                    HttpStatus.CONFLICT);
        }

        collectionRepository.delete(collection);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CollectionResponse> getCollections() {
        return collectionRepository.findByIsActiveTrue().stream()
                .map(this::mapToCollectionResponse)
                .collect(Collectors.toList());
    }

    // --- Mapper methods ---

    private CategoryResponse mapToCategoryResponse(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .iconBase64(category.getIconBase64())
                .imageBase64(category.getImageBase64())
                .sortOrder(category.getSortOrder())
                .isVisible(category.getIsVisible())
                .isActive(category.getIsActive())
                .createdAt(category.getCreatedAt())
                .updatedAt(category.getUpdatedAt())
                .build();
    }

    private SubCategoryResponse mapToSubCategoryResponse(SubCategory subCategory) {
        return SubCategoryResponse.builder()
                .id(subCategory.getId())
                .name(subCategory.getName())
                .categoryId(subCategory.getCategoryId())
                .sortOrder(subCategory.getSortOrder())
                .isActive(subCategory.getIsActive())
                .createdAt(subCategory.getCreatedAt())
                .updatedAt(subCategory.getUpdatedAt())
                .build();
    }

    private CollectionResponse mapToCollectionResponse(Collection collection) {
        return CollectionResponse.builder()
                .id(collection.getId())
                .name(collection.getName())
                .description(collection.getDescription())
                .imageBase64(collection.getImageBase64())
                .isActive(collection.getIsActive())
                .createdAt(collection.getCreatedAt())
                .updatedAt(collection.getUpdatedAt())
                .build();
    }
}
