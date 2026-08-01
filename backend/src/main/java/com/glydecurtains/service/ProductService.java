package com.glydecurtains.service;

import com.glydecurtains.dto.request.ProductCreateRequest;
import com.glydecurtains.dto.request.ProductFilterRequest;
import com.glydecurtains.dto.request.ProductUpdateRequest;
import com.glydecurtains.dto.request.SpecificationRequest;
import com.glydecurtains.dto.request.VariantPriceRequest;
import com.glydecurtains.dto.response.PageResponse;
import com.glydecurtains.dto.response.ProductDetailResponse;
import com.glydecurtains.dto.response.ProductResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Map;

public interface ProductService {

    ProductResponse createProduct(ProductCreateRequest request);

    ProductResponse updateProduct(Long id, ProductUpdateRequest request);

    void deleteProduct(Long id);

    ProductResponse archiveProduct(Long id);

    ProductResponse activateProduct(Long id);

    ProductResponse deactivateProduct(Long id);

    ProductDetailResponse getProduct(Long id);

    /**
     * Get product detail with translated fields applied for the given language.
     * Falls back to English if translation not available.
     */
    ProductDetailResponse getProduct(Long id, String language);

    PageResponse<ProductResponse> getProducts(ProductFilterRequest filter, Pageable pageable);

    List<ProductResponse> getRelatedProducts(Long productId);

    List<ProductResponse> getSimilarProducts(Long productId);

    void updateSpecifications(Long productId, List<SpecificationRequest> specs);

    void updateVariantPricing(Long productId, List<VariantPriceRequest> variants);

    /**
     * Save translations for product fields in a specific language.
     * Supported fields: name, shortDescription, longDescription, metaTitle, metaDescription, metaKeywords.
     */
    void saveProductTranslations(Long productId, String language, Map<String, String> translations);

    /**
     * Get all translations for a product (all languages).
     * Returns map of language → (fieldName → content).
     */
    Map<String, Map<String, String>> getProductTranslations(Long productId);

    /**
     * Delete all translations for a product.
     */
    void deleteProductTranslations(Long productId);
}
