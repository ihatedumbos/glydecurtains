package com.glydecurtains.controller;

import com.glydecurtains.dto.request.*;
import com.glydecurtains.dto.response.*;
import com.glydecurtains.security.RequiresPermission;
import com.glydecurtains.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    // --- Admin product CRUD endpoints ---

    @PostMapping("/products")
    @RequiresPermission(entity = "products", operation = "CREATE")
    public ResponseEntity<ApiResponse<ProductResponse>> createProduct(
            @Valid @RequestBody ProductCreateRequest request) {
        ProductResponse response = productService.createProduct(request);
        return ResponseEntity.status(201).body(ApiResponse.created("Product created successfully", response));
    }

    @PutMapping("/products/{id}")
    @RequiresPermission(entity = "products", operation = "UPDATE")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductUpdateRequest request) {
        ProductResponse response = productService.updateProduct(id, request);
        return ResponseEntity.ok(ApiResponse.success("Product updated successfully", response));
    }

    @DeleteMapping("/products/{id}")
    @RequiresPermission(entity = "products", operation = "DELETE")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok(ApiResponse.noContent());
    }

    @PutMapping("/products/{id}/archive")
    @RequiresPermission(entity = "products", operation = "UPDATE")
    public ResponseEntity<ApiResponse<ProductResponse>> archiveProduct(@PathVariable Long id) {
        ProductResponse response = productService.archiveProduct(id);
        return ResponseEntity.ok(ApiResponse.success("Product archived successfully", response));
    }

    @PutMapping("/products/{id}/activate")
    @RequiresPermission(entity = "products", operation = "UPDATE")
    public ResponseEntity<ApiResponse<ProductResponse>> activateProduct(@PathVariable Long id) {
        ProductResponse response = productService.activateProduct(id);
        return ResponseEntity.ok(ApiResponse.success("Product activated successfully", response));
    }

    @PutMapping("/products/{id}/deactivate")
    @RequiresPermission(entity = "products", operation = "UPDATE")
    public ResponseEntity<ApiResponse<ProductResponse>> deactivateProduct(@PathVariable Long id) {
        ProductResponse response = productService.deactivateProduct(id);
        return ResponseEntity.ok(ApiResponse.success("Product deactivated successfully", response));
    }

    // --- Product flag management ---

    @PutMapping("/products/{id}/flags")
    @RequiresPermission(entity = "products", operation = "UPDATE")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProductFlags(
            @PathVariable Long id,
            @Valid @RequestBody ProductUpdateRequest request) {
        ProductResponse response = productService.updateProduct(id, request);
        return ResponseEntity.ok(ApiResponse.success("Product flags updated successfully", response));
    }

    // --- Specification management ---

    @PutMapping("/products/{id}/specifications")
    @RequiresPermission(entity = "products", operation = "UPDATE")
    public ResponseEntity<ApiResponse<Void>> updateSpecifications(
            @PathVariable Long id,
            @Valid @RequestBody List<SpecificationRequest> specs) {
        productService.updateSpecifications(id, specs);
        return ResponseEntity.ok(ApiResponse.success("Specifications updated successfully", null));
    }

    // --- Variant pricing matrix ---

    @PutMapping("/products/{id}/variants")
    @RequiresPermission(entity = "products", operation = "UPDATE")
    public ResponseEntity<ApiResponse<Void>> updateVariantPricing(
            @PathVariable Long id,
            @Valid @RequestBody List<VariantPriceRequest> variants) {
        productService.updateVariantPricing(id, variants);
        return ResponseEntity.ok(ApiResponse.success("Variant pricing updated successfully", null));
    }

    // --- Product listing and detail (admin) ---

    @GetMapping("/products")
    @RequiresPermission(entity = "products", operation = "READ")
    public ResponseEntity<ApiResponse<PageResponse<ProductResponse>>> getProducts(
            ProductFilterRequest filter,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        PageResponse<ProductResponse> response = productService.getProducts(filter, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/products/{id}")
    @RequiresPermission(entity = "products", operation = "READ")
    public ResponseEntity<ApiResponse<ProductDetailResponse>> getProduct(@PathVariable Long id) {
        ProductDetailResponse response = productService.getProduct(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // --- Public product endpoints (no auth required) ---

    @GetMapping("/products/public")
    public ResponseEntity<ApiResponse<PageResponse<ProductResponse>>> getPublicProducts(
            ProductFilterRequest filter,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        // Force filter to only show ACTIVE products for public access
        if (filter == null) {
            filter = new ProductFilterRequest();
        }
        filter.setStatus(com.glydecurtains.entity.enums.ProductStatus.ACTIVE);
        PageResponse<ProductResponse> response = productService.getProducts(filter, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/products/public/{id}")
    public ResponseEntity<ApiResponse<ProductDetailResponse>> getPublicProduct(
            @PathVariable Long id,
            @RequestHeader(value = "Accept-Language", required = false) String language) {
        ProductDetailResponse response = productService.getProduct(id, language);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // --- Related and similar products ---

    @GetMapping("/products/{id}/related")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getRelatedProducts(@PathVariable Long id) {
        List<ProductResponse> response = productService.getRelatedProducts(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/products/{id}/similar")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getSimilarProducts(@PathVariable Long id) {
        List<ProductResponse> response = productService.getSimilarProducts(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // --- Translation management ---

    @PutMapping("/products/{id}/translations/{language}")
    @RequiresPermission(entity = "products", operation = "UPDATE")
    public ResponseEntity<ApiResponse<Void>> saveProductTranslations(
            @PathVariable Long id,
            @PathVariable String language,
            @RequestBody Map<String, String> translations) {
        productService.saveProductTranslations(id, language, translations);
        return ResponseEntity.ok(ApiResponse.success("Translations saved successfully", null));
    }

    @GetMapping("/products/{id}/translations")
    @RequiresPermission(entity = "products", operation = "READ")
    public ResponseEntity<ApiResponse<Map<String, Map<String, String>>>> getProductTranslations(
            @PathVariable Long id) {
        Map<String, Map<String, String>> response = productService.getProductTranslations(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/products/{id}/translations")
    @RequiresPermission(entity = "products", operation = "DELETE")
    public ResponseEntity<ApiResponse<Void>> deleteProductTranslations(@PathVariable Long id) {
        productService.deleteProductTranslations(id);
        return ResponseEntity.ok(ApiResponse.success("Translations deleted successfully", null));
    }
}
