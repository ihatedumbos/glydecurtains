package com.glydecurtains.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.glydecurtains.dto.request.*;
import com.glydecurtains.dto.response.*;
import com.glydecurtains.entity.*;
import com.glydecurtains.entity.enums.ProductStatus;
import com.glydecurtains.exception.BusinessException;
import com.glydecurtains.repository.*;
import com.glydecurtains.service.ProductService;
import com.glydecurtains.service.TranslationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final ProductSpecificationRepository specificationRepository;
    private final ProductVariantRepository variantRepository;
    private final ProductImageRepository imageRepository;
    private final CategoryRepository categoryRepository;
    private final SubCategoryRepository subCategoryRepository;
    private final CollectionRepository collectionRepository;
    private final TranslationService translationService;
    private final ObjectMapper objectMapper;

    private static final String ENTITY_TYPE_PRODUCT = "PRODUCT";

    @Override
    public ProductResponse createProduct(ProductCreateRequest request) {
        // Validate SKU uniqueness
        if (productRepository.existsBySku(request.getSku())) {
            throw new BusinessException(
                    "Product with SKU '" + request.getSku() + "' already exists",
                    "PRODUCT_DUPLICATE_SKU",
                    HttpStatus.CONFLICT);
        }

        // Validate category exists
        categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new BusinessException(
                        "Category not found with id: " + request.getCategoryId(),
                        "CATEGORY_NOT_FOUND",
                        HttpStatus.NOT_FOUND));

        // Validate sub-category if provided
        if (request.getSubCategoryId() != null) {
            subCategoryRepository.findById(request.getSubCategoryId())
                    .orElseThrow(() -> new BusinessException(
                            "Sub-category not found with id: " + request.getSubCategoryId(),
                            "SUB_CATEGORY_NOT_FOUND",
                            HttpStatus.NOT_FOUND));
        }

        // Validate collection if provided
        if (request.getCollectionId() != null) {
            collectionRepository.findById(request.getCollectionId())
                    .orElseThrow(() -> new BusinessException(
                            "Collection not found with id: " + request.getCollectionId(),
                            "COLLECTION_NOT_FOUND",
                            HttpStatus.NOT_FOUND));
        }

        Product product = new Product();
        product.setName(request.getName());
        product.setSku(request.getSku());
        product.setBarcode(request.getBarcode());
        product.setShortDescription(request.getShortDescription());
        product.setLongDescription(request.getLongDescription());
        product.setCategoryId(request.getCategoryId());
        product.setSubCategoryId(request.getSubCategoryId());
        product.setCollectionId(request.getCollectionId());
        product.setBrand(request.getBrand());
        product.setMaterial(request.getMaterial());
        product.setPattern(request.getPattern());
        product.setColors(toJson(request.getColors()));
        product.setSizes(toJson(request.getSizes()));
        product.setLength(request.getLength());
        product.setWidth(request.getWidth());
        product.setHeight(request.getHeight());
        product.setWeight(request.getWeight());
        product.setStockQuantity(request.getStockQuantity());
        product.setBasePrice(request.getBasePrice());
        product.setDiscountPercentage(request.getDiscountPercentage() != null ? request.getDiscountPercentage() : BigDecimal.ZERO);
        product.setOfferPrice(calculateOfferPrice(request.getBasePrice(), request.getDiscountPercentage()));
        product.setStatus(ProductStatus.ACTIVE);
        product.setIsFeatured(request.getIsFeatured() != null ? request.getIsFeatured() : false);
        product.setIsTrending(request.getIsTrending() != null ? request.getIsTrending() : false);
        product.setIsNewArrival(request.getIsNewArrival() != null ? request.getIsNewArrival() : false);
        product.setIsBestSeller(request.getIsBestSeller() != null ? request.getIsBestSeller() : false);
        product.setIsPremium(request.getIsPremium() != null ? request.getIsPremium() : false);
        product.setTags(toJson(request.getTags()));
        product.setMetaTitle(request.getMetaTitle());
        product.setMetaDescription(request.getMetaDescription());
        product.setMetaKeywords(request.getMetaKeywords());

        Product saved = productRepository.save(product);
        return mapToProductResponse(saved);
    }

    @Override
    public ProductResponse updateProduct(Long id, ProductUpdateRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new BusinessException(
                        "Product not found with id: " + id,
                        "PRODUCT_NOT_FOUND",
                        HttpStatus.NOT_FOUND));

        // Validate SKU uniqueness if being changed
        if (request.getSku() != null && !request.getSku().equals(product.getSku())) {
            if (productRepository.existsBySkuAndIdNot(request.getSku(), id)) {
                throw new BusinessException(
                        "Product with SKU '" + request.getSku() + "' already exists",
                        "PRODUCT_DUPLICATE_SKU",
                        HttpStatus.CONFLICT);
            }
            product.setSku(request.getSku());
        }

        // Validate category if being changed
        if (request.getCategoryId() != null) {
            categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new BusinessException(
                            "Category not found with id: " + request.getCategoryId(),
                            "CATEGORY_NOT_FOUND",
                            HttpStatus.NOT_FOUND));
            product.setCategoryId(request.getCategoryId());
        }

        // Validate sub-category if being changed
        if (request.getSubCategoryId() != null) {
            subCategoryRepository.findById(request.getSubCategoryId())
                    .orElseThrow(() -> new BusinessException(
                            "Sub-category not found with id: " + request.getSubCategoryId(),
                            "SUB_CATEGORY_NOT_FOUND",
                            HttpStatus.NOT_FOUND));
            product.setSubCategoryId(request.getSubCategoryId());
        }

        // Validate collection if being changed
        if (request.getCollectionId() != null) {
            collectionRepository.findById(request.getCollectionId())
                    .orElseThrow(() -> new BusinessException(
                            "Collection not found with id: " + request.getCollectionId(),
                            "COLLECTION_NOT_FOUND",
                            HttpStatus.NOT_FOUND));
            product.setCollectionId(request.getCollectionId());
        }

        if (request.getName() != null) product.setName(request.getName());
        if (request.getBarcode() != null) product.setBarcode(request.getBarcode());
        if (request.getShortDescription() != null) product.setShortDescription(request.getShortDescription());
        if (request.getLongDescription() != null) product.setLongDescription(request.getLongDescription());
        if (request.getBrand() != null) product.setBrand(request.getBrand());
        if (request.getMaterial() != null) product.setMaterial(request.getMaterial());
        if (request.getPattern() != null) product.setPattern(request.getPattern());
        if (request.getColors() != null) product.setColors(toJson(request.getColors()));
        if (request.getSizes() != null) product.setSizes(toJson(request.getSizes()));
        if (request.getLength() != null) product.setLength(request.getLength());
        if (request.getWidth() != null) product.setWidth(request.getWidth());
        if (request.getHeight() != null) product.setHeight(request.getHeight());
        if (request.getWeight() != null) product.setWeight(request.getWeight());
        if (request.getStockQuantity() != null) product.setStockQuantity(request.getStockQuantity());
        if (request.getBasePrice() != null) product.setBasePrice(request.getBasePrice());
        if (request.getDiscountPercentage() != null) product.setDiscountPercentage(request.getDiscountPercentage());
        if (request.getIsFeatured() != null) product.setIsFeatured(request.getIsFeatured());
        if (request.getIsTrending() != null) product.setIsTrending(request.getIsTrending());
        if (request.getIsNewArrival() != null) product.setIsNewArrival(request.getIsNewArrival());
        if (request.getIsBestSeller() != null) product.setIsBestSeller(request.getIsBestSeller());
        if (request.getIsPremium() != null) product.setIsPremium(request.getIsPremium());
        if (request.getTags() != null) product.setTags(toJson(request.getTags()));
        if (request.getMetaTitle() != null) product.setMetaTitle(request.getMetaTitle());
        if (request.getMetaDescription() != null) product.setMetaDescription(request.getMetaDescription());
        if (request.getMetaKeywords() != null) product.setMetaKeywords(request.getMetaKeywords());

        // Recalculate offer price
        product.setOfferPrice(calculateOfferPrice(product.getBasePrice(), product.getDiscountPercentage()));

        Product saved = productRepository.save(product);
        return mapToProductResponse(saved);
    }

    @Override
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new BusinessException(
                        "Product not found with id: " + id,
                        "PRODUCT_NOT_FOUND",
                        HttpStatus.NOT_FOUND));

        // Clean up translations
        translationService.deleteTranslations(ENTITY_TYPE_PRODUCT, id);

        productRepository.delete(product);
    }

    @Override
    public ProductResponse archiveProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new BusinessException(
                        "Product not found with id: " + id,
                        "PRODUCT_NOT_FOUND",
                        HttpStatus.NOT_FOUND));

        product.setStatus(ProductStatus.ARCHIVED);
        Product saved = productRepository.save(product);
        return mapToProductResponse(saved);
    }

    @Override
    public ProductResponse activateProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new BusinessException(
                        "Product not found with id: " + id,
                        "PRODUCT_NOT_FOUND",
                        HttpStatus.NOT_FOUND));

        product.setStatus(ProductStatus.ACTIVE);
        Product saved = productRepository.save(product);
        return mapToProductResponse(saved);
    }

    @Override
    public ProductResponse deactivateProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new BusinessException(
                        "Product not found with id: " + id,
                        "PRODUCT_NOT_FOUND",
                        HttpStatus.NOT_FOUND));

        product.setStatus(ProductStatus.DEACTIVATED);
        Product saved = productRepository.save(product);
        return mapToProductResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductDetailResponse getProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new BusinessException(
                        "Product not found with id: " + id,
                        "PRODUCT_NOT_FOUND",
                        HttpStatus.NOT_FOUND));

        return mapToProductDetailResponse(product);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ProductResponse> getProducts(ProductFilterRequest filter, Pageable pageable) {
        Page<Product> page;

        if (filter != null && filter.getQuery() != null && !filter.getQuery().isBlank()) {
            if (filter.getStatus() != null) {
                page = productRepository.search(filter.getQuery(), filter.getStatus(), pageable);
            } else {
                page = productRepository.searchAll(filter.getQuery(), pageable);
            }
        } else if (filter != null && filter.getCategoryId() != null) {
            if (filter.getStatus() != null) {
                page = productRepository.findByCategoryIdAndStatus(filter.getCategoryId(), filter.getStatus(), pageable);
            } else {
                page = productRepository.findByCategoryId(filter.getCategoryId(), pageable);
            }
        } else if (filter != null && filter.getStatus() != null) {
            page = productRepository.findByStatus(filter.getStatus(), pageable);
        } else {
            page = productRepository.findAll(pageable);
        }

        List<ProductResponse> content = page.getContent().stream()
                .map(this::mapToProductResponse)
                .collect(Collectors.toList());

        return PageResponse.of(content, page.getNumber(), page.getSize(),
                page.getTotalElements(), page.getTotalPages(), page.isLast());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductResponse> getRelatedProducts(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new BusinessException(
                        "Product not found with id: " + productId,
                        "PRODUCT_NOT_FOUND",
                        HttpStatus.NOT_FOUND));

        // Related products: same category, active, excluding current product
        List<Product> related = productRepository.findByCategoryIdAndStatusAndIdNot(
                product.getCategoryId(), ProductStatus.ACTIVE, productId);

        return related.stream()
                .limit(10)
                .map(this::mapToProductResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductResponse> getSimilarProducts(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new BusinessException(
                        "Product not found with id: " + productId,
                        "PRODUCT_NOT_FOUND",
                        HttpStatus.NOT_FOUND));

        // Similar products: shared attributes (material, brand, pattern)
        String material = product.getMaterial() != null ? product.getMaterial() : "";
        String brand = product.getBrand() != null ? product.getBrand() : "";
        String pattern = product.getPattern() != null ? product.getPattern() : "";

        List<Product> similar = productRepository.findSimilarProducts(
                productId, ProductStatus.ACTIVE, material, brand, pattern);

        return similar.stream()
                .limit(10)
                .map(this::mapToProductResponse)
                .collect(Collectors.toList());
    }

    @Override
    public void updateSpecifications(Long productId, List<SpecificationRequest> specs) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new BusinessException(
                        "Product not found with id: " + productId,
                        "PRODUCT_NOT_FOUND",
                        HttpStatus.NOT_FOUND));

        // Remove existing specifications
        specificationRepository.deleteByProductId(productId);
        product.getSpecifications().clear();

        // Add new specifications
        if (specs != null && !specs.isEmpty()) {
            int sortIndex = 0;
            for (SpecificationRequest spec : specs) {
                ProductSpecification specification = new ProductSpecification();
                specification.setProduct(product);
                specification.setSpecKey(spec.getSpecKey());
                specification.setSpecValue(spec.getSpecValue());
                specification.setSortOrder(spec.getSortOrder() != null ? spec.getSortOrder() : sortIndex);
                product.getSpecifications().add(specification);
                sortIndex++;
            }
            productRepository.save(product);
        }
    }

    @Override
    public void updateVariantPricing(Long productId, List<VariantPriceRequest> variants) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new BusinessException(
                        "Product not found with id: " + productId,
                        "PRODUCT_NOT_FOUND",
                        HttpStatus.NOT_FOUND));

        // Remove existing variants
        variantRepository.deleteByProductId(productId);
        product.getVariants().clear();

        // Add new variants
        if (variants != null && !variants.isEmpty()) {
            for (VariantPriceRequest variantReq : variants) {
                ProductVariant variant = new ProductVariant();
                variant.setProduct(product);
                variant.setMaterial(variantReq.getMaterial());
                variant.setSize(variantReq.getSize());
                variant.setColor(variantReq.getColor());
                variant.setPrice(variantReq.getPrice());
                variant.setStockQuantity(variantReq.getStockQuantity() != null ? variantReq.getStockQuantity() : 0);
                product.getVariants().add(variant);
            }
            productRepository.save(product);
        }
    }

    // --- Translation methods ---

    @Override
    @Transactional(readOnly = true)
    public ProductDetailResponse getProduct(Long id, String language) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new BusinessException(
                        "Product not found with id: " + id,
                        "PRODUCT_NOT_FOUND",
                        HttpStatus.NOT_FOUND));

        ProductDetailResponse response = mapToProductDetailResponse(product);

        // Apply translations if language is not English (or null)
        if (language != null && !language.isBlank()) {
            Map<String, String> translations = translationService.getTranslatedFields(
                    ENTITY_TYPE_PRODUCT, id, language);

            if (!translations.isEmpty()) {
                if (translations.containsKey("name")) {
                    response.setName(translations.get("name"));
                }
                if (translations.containsKey("shortDescription")) {
                    response.setShortDescription(translations.get("shortDescription"));
                }
                if (translations.containsKey("longDescription")) {
                    response.setLongDescription(translations.get("longDescription"));
                }
                if (translations.containsKey("metaTitle")) {
                    response.setMetaTitle(translations.get("metaTitle"));
                }
                if (translations.containsKey("metaDescription")) {
                    response.setMetaDescription(translations.get("metaDescription"));
                }
                if (translations.containsKey("metaKeywords")) {
                    response.setMetaKeywords(translations.get("metaKeywords"));
                }
            }
        }

        return response;
    }

    @Override
    public void saveProductTranslations(Long productId, String language, Map<String, String> translations) {
        // Verify product exists
        productRepository.findById(productId)
                .orElseThrow(() -> new BusinessException(
                        "Product not found with id: " + productId,
                        "PRODUCT_NOT_FOUND",
                        HttpStatus.NOT_FOUND));

        translationService.saveTranslations(ENTITY_TYPE_PRODUCT, productId, language, translations);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Map<String, String>> getProductTranslations(Long productId) {
        // Verify product exists
        productRepository.findById(productId)
                .orElseThrow(() -> new BusinessException(
                        "Product not found with id: " + productId,
                        "PRODUCT_NOT_FOUND",
                        HttpStatus.NOT_FOUND));

        return translationService.getAllTranslations(ENTITY_TYPE_PRODUCT, productId);
    }

    @Override
    public void deleteProductTranslations(Long productId) {
        // Verify product exists
        productRepository.findById(productId)
                .orElseThrow(() -> new BusinessException(
                        "Product not found with id: " + productId,
                        "PRODUCT_NOT_FOUND",
                        HttpStatus.NOT_FOUND));

        translationService.deleteTranslations(ENTITY_TYPE_PRODUCT, productId);
    }

    // --- Helper methods ---

    private BigDecimal calculateOfferPrice(BigDecimal basePrice, BigDecimal discountPercentage) {
        if (basePrice == null) return null;
        if (discountPercentage == null || discountPercentage.compareTo(BigDecimal.ZERO) == 0) {
            return basePrice;
        }
        BigDecimal discount = basePrice.multiply(discountPercentage)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        return basePrice.subtract(discount);
    }

    private String toJson(List<String> list) {
        if (list == null || list.isEmpty()) return null;
        try {
            return objectMapper.writeValueAsString(list);
        } catch (JsonProcessingException e) {
            return null;
        }
    }

    private List<String> fromJson(String json) {
        if (json == null || json.isBlank()) return Collections.emptyList();
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (JsonProcessingException e) {
            return Collections.emptyList();
        }
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
                    .map(Collection::getName).orElse(null);
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
                .thumbnailUrl(toDisplayUrl(thumbnailBase64, "image/jpeg"))
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }

    private String toDisplayUrl(String mediaData, String mimeType) {
        if (mediaData == null || mediaData.isBlank()) {
            return null;
        }
        if (mediaData.startsWith("/") || mediaData.startsWith("http://") || mediaData.startsWith("https://") || mediaData.startsWith("data:")) {
            return mediaData;
        }
        return "data:" + mimeType + ";base64," + mediaData;
    }

    private ProductDetailResponse mapToProductDetailResponse(Product product) {
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
                    .map(Collection::getName).orElse(null);
        }

        List<ProductImageResponse> imageResponses = product.getImages() != null
                ? product.getImages().stream().map(this::mapToImageResponse).collect(Collectors.toList())
                : new ArrayList<>();

        List<ProductSpecificationResponse> specResponses = product.getSpecifications() != null
                ? product.getSpecifications().stream().map(this::mapToSpecResponse).collect(Collectors.toList())
                : new ArrayList<>();

        List<ProductVariantResponse> variantResponses = product.getVariants() != null
                ? product.getVariants().stream().map(this::mapToVariantResponse).collect(Collectors.toList())
                : new ArrayList<>();

        return ProductDetailResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .sku(product.getSku())
                .barcode(product.getBarcode())
                .shortDescription(product.getShortDescription())
                .longDescription(product.getLongDescription())
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
                .length(product.getLength())
                .width(product.getWidth())
                .height(product.getHeight())
                .weight(product.getWeight())
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
                .metaTitle(product.getMetaTitle())
                .metaDescription(product.getMetaDescription())
                .metaKeywords(product.getMetaKeywords())
                .images(imageResponses)
                .specifications(specResponses)
                .variants(variantResponses)
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }

    private ProductImageResponse mapToImageResponse(ProductImage image) {
        return ProductImageResponse.builder()
                .id(image.getId())
                .base64Data(image.getBase64Data())
                .mimeType(image.getMimeType())
                .mediaType(image.getMediaType() != null ? image.getMediaType().name() : null)
                .originalFilename(image.getOriginalFilename())
                .width(image.getWidth())
                .height(image.getHeight())
                .isThumbnail(image.getIsThumbnail())
                .sortOrder(image.getSortOrder())
                .uploadedAt(image.getUploadedAt())
                .build();
    }

    private ProductSpecificationResponse mapToSpecResponse(ProductSpecification spec) {
        return ProductSpecificationResponse.builder()
                .id(spec.getId())
                .specKey(spec.getSpecKey())
                .specValue(spec.getSpecValue())
                .sortOrder(spec.getSortOrder())
                .build();
    }

    private ProductVariantResponse mapToVariantResponse(ProductVariant variant) {
        return ProductVariantResponse.builder()
                .id(variant.getId())
                .material(variant.getMaterial())
                .size(variant.getSize())
                .color(variant.getColor())
                .price(variant.getPrice())
                .stockQuantity(variant.getStockQuantity())
                .build();
    }
}
