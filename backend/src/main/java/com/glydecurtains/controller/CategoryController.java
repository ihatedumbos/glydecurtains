package com.glydecurtains.controller;

import com.glydecurtains.dto.request.*;
import com.glydecurtains.dto.response.*;
import com.glydecurtains.security.RequiresPermission;
import com.glydecurtains.service.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    // --- Category endpoints ---

    @PostMapping("/categories")
    @RequiresPermission(entity = "categories", operation = "CREATE")
    public ResponseEntity<ApiResponse<CategoryResponse>> createCategory(
            @Valid @RequestBody CategoryCreateRequest request) {
        CategoryResponse response = categoryService.createCategory(request);
        return ResponseEntity.status(201).body(ApiResponse.created("Category created successfully", response));
    }

    @PutMapping("/categories/{id}")
    @RequiresPermission(entity = "categories", operation = "UPDATE")
    public ResponseEntity<ApiResponse<CategoryResponse>> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody CategoryUpdateRequest request) {
        CategoryResponse response = categoryService.updateCategory(id, request);
        return ResponseEntity.ok(ApiResponse.success("Category updated successfully", response));
    }

    @DeleteMapping("/categories/{id}")
    @RequiresPermission(entity = "categories", operation = "DELETE")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.ok(ApiResponse.noContent());
    }

    @GetMapping("/categories/public/tree")
    public ResponseEntity<ApiResponse<List<CategoryTreeResponse>>> getCategoryTree() {
        List<CategoryTreeResponse> tree = categoryService.getCategoryTree();
        return ResponseEntity.ok(ApiResponse.success(tree));
    }

    @PutMapping("/categories/{id}/sort-order")
    @RequiresPermission(entity = "categories", operation = "UPDATE")
    public ResponseEntity<ApiResponse<CategoryResponse>> updateSortOrder(
            @PathVariable Long id,
            @RequestParam int sortOrder) {
        CategoryResponse response = categoryService.updateSortOrder(id, sortOrder);
        return ResponseEntity.ok(ApiResponse.success("Sort order updated successfully", response));
    }

    @PutMapping("/categories/{id}/visibility")
    @RequiresPermission(entity = "categories", operation = "UPDATE")
    public ResponseEntity<ApiResponse<CategoryResponse>> toggleVisibility(
            @PathVariable Long id,
            @RequestParam boolean visible) {
        CategoryResponse response = categoryService.toggleVisibility(id, visible);
        return ResponseEntity.ok(ApiResponse.success("Visibility updated successfully", response));
    }

    @PutMapping("/categories/{id}/active")
    @RequiresPermission(entity = "categories", operation = "UPDATE")
    public ResponseEntity<ApiResponse<CategoryResponse>> toggleActive(
            @PathVariable Long id,
            @RequestParam boolean active) {
        CategoryResponse response = categoryService.toggleActive(id, active);
        return ResponseEntity.ok(ApiResponse.success("Active status updated successfully", response));
    }

    @GetMapping("/categories")
    @RequiresPermission(entity = "categories", operation = "READ")
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getAllCategories() {
        List<CategoryResponse> categories = categoryService.getAllCategories();
        return ResponseEntity.ok(ApiResponse.success(categories));
    }

    @GetMapping("/categories/{id}")
    @RequiresPermission(entity = "categories", operation = "READ")
    public ResponseEntity<ApiResponse<CategoryResponse>> getCategory(@PathVariable Long id) {
        CategoryResponse response = categoryService.getCategory(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // --- Sub-category endpoints ---

    @GetMapping("/categories/{categoryId}/sub-categories")
    @RequiresPermission(entity = "categories", operation = "READ")
    public ResponseEntity<ApiResponse<List<SubCategoryResponse>>> getSubCategories(
            @PathVariable Long categoryId) {
        List<SubCategoryResponse> subCategories = categoryService.getSubCategories(categoryId);
        return ResponseEntity.ok(ApiResponse.success(subCategories));
    }

    @PostMapping("/categories/{categoryId}/sub-categories")
    @RequiresPermission(entity = "categories", operation = "CREATE")
    public ResponseEntity<ApiResponse<SubCategoryResponse>> createSubCategory(
            @PathVariable Long categoryId,
            @Valid @RequestBody SubCategoryCreateRequest request) {
        SubCategoryResponse response = categoryService.createSubCategory(categoryId, request);
        return ResponseEntity.status(201).body(ApiResponse.created("Sub-category created successfully", response));
    }

    @PutMapping("/categories/sub-categories/{id}")
    @RequiresPermission(entity = "categories", operation = "UPDATE")
    public ResponseEntity<ApiResponse<SubCategoryResponse>> updateSubCategory(
            @PathVariable Long id,
            @Valid @RequestBody SubCategoryUpdateRequest request) {
        SubCategoryResponse response = categoryService.updateSubCategory(id, request);
        return ResponseEntity.ok(ApiResponse.success("Sub-category updated successfully", response));
    }

    @DeleteMapping("/categories/sub-categories/{id}")
    @RequiresPermission(entity = "categories", operation = "DELETE")
    public ResponseEntity<ApiResponse<Void>> deleteSubCategory(@PathVariable Long id) {
        categoryService.deleteSubCategory(id);
        return ResponseEntity.ok(ApiResponse.noContent());
    }

    // --- Collection endpoints ---

    @PostMapping("/collections")
    @RequiresPermission(entity = "categories", operation = "CREATE")
    public ResponseEntity<ApiResponse<CollectionResponse>> createCollection(
            @Valid @RequestBody CollectionCreateRequest request) {
        CollectionResponse response = categoryService.createCollection(request);
        return ResponseEntity.status(201).body(ApiResponse.created("Collection created successfully", response));
    }

    @PutMapping("/collections/{id}")
    @RequiresPermission(entity = "categories", operation = "UPDATE")
    public ResponseEntity<ApiResponse<CollectionResponse>> updateCollection(
            @PathVariable Long id,
            @Valid @RequestBody CollectionUpdateRequest request) {
        CollectionResponse response = categoryService.updateCollection(id, request);
        return ResponseEntity.ok(ApiResponse.success("Collection updated successfully", response));
    }

    @DeleteMapping("/collections/{id}")
    @RequiresPermission(entity = "categories", operation = "DELETE")
    public ResponseEntity<ApiResponse<Void>> deleteCollection(@PathVariable Long id) {
        categoryService.deleteCollection(id);
        return ResponseEntity.ok(ApiResponse.noContent());
    }

    @GetMapping("/collections/public")
    public ResponseEntity<ApiResponse<List<CollectionResponse>>> getCollections() {
        List<CollectionResponse> collections = categoryService.getCollections();
        return ResponseEntity.ok(ApiResponse.success(collections));
    }
}
