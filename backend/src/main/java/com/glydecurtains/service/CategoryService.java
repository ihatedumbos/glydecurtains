package com.glydecurtains.service;

import com.glydecurtains.dto.request.*;
import com.glydecurtains.dto.response.CategoryResponse;
import com.glydecurtains.dto.response.CategoryTreeResponse;
import com.glydecurtains.dto.response.CollectionResponse;
import com.glydecurtains.dto.response.SubCategoryResponse;

import java.util.List;

public interface CategoryService {

    CategoryResponse createCategory(CategoryCreateRequest request);

    CategoryResponse updateCategory(Long id, CategoryUpdateRequest request);

    void deleteCategory(Long id);

    List<CategoryTreeResponse> getCategoryTree();

    CategoryResponse updateSortOrder(Long id, int sortOrder);

    CategoryResponse toggleVisibility(Long id, boolean visible);

    CategoryResponse toggleActive(Long id, boolean active);

    List<CategoryResponse> getAllCategories();

    CategoryResponse getCategory(Long id);

    SubCategoryResponse createSubCategory(Long categoryId, SubCategoryCreateRequest request);

    SubCategoryResponse updateSubCategory(Long id, SubCategoryUpdateRequest request);

    void deleteSubCategory(Long id);

    List<SubCategoryResponse> getSubCategories(Long categoryId);

    CollectionResponse createCollection(CollectionCreateRequest request);

    CollectionResponse updateCollection(Long id, CollectionUpdateRequest request);

    void deleteCollection(Long id);

    List<CollectionResponse> getCollections();
}
