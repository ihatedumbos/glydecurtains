package com.glydecurtains.repository.spec;

import com.glydecurtains.dto.request.ProductFilterRequest;
import com.glydecurtains.entity.Product;
import com.glydecurtains.entity.TranslatedContent;
import com.glydecurtains.entity.enums.ProductStatus;
import com.glydecurtains.repository.ProductRepository;
import com.glydecurtains.repository.TranslatedContentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Runs the product filter and sort specifications against a real (H2) database,
 * since the ordering and matching happen in SQL.
 */
@DataJpaTest
class ProductSpecificationsTest {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private TranslatedContentRepository translatedContentRepository;

    private Product velvet;
    private Product blind;
    private Product silk;
    private Product archived;

    @BeforeEach
    void setUp() {
        velvet = save(product("Velvet Curtain", "SKU-001", 1L, "Velvet", "[\"Red\",\"Blue\"]", "[\"Large\"]",
                "4999", null, 10));
        blind = save(product("Wooden Blind", "SKU-002", 2L, "Wood", "[\"Brown\"]", "[\"Small\"]",
                "2999", null, 0));
        silk = save(product("Premium Silk Curtain", "SKU-003", 1L, "Silk", "[\"Cream\"]", "[\"Large\",\"Custom\"]",
                "19999", "1499", 3));
        silk.setIsBestSeller(true);
        save(silk);
        archived = product("Archived Curtain", "SKU-004", 1L, "Velvet", "[\"Red\"]", "[]", "999", null, 5);
        archived.setStatus(ProductStatus.ARCHIVED);
        save(archived);
    }

    @Test
    @DisplayName("Filters by multiple colours, sizes and materials (any of each)")
    void filtersByMultiValueAttributes() {
        assertThat(names(filter().colors("red,brown").build(), null))
                .containsExactlyInAnyOrder("Velvet Curtain", "Wooden Blind");
        assertThat(names(filter().sizes("Custom").build(), null))
                .containsExactly("Premium Silk Curtain");
        assertThat(names(filter().materials("silk,WOOD").build(), null))
                .containsExactlyInAnyOrder("Premium Silk Curtain", "Wooden Blind");
    }

    @Test
    @DisplayName("Price range and in-stock filters use the price customers pay")
    void filtersByEffectivePriceAndStock() {
        // Silk's offer price (1499) is inside the range even though its base price is not.
        assertThat(names(filter().minPrice(new BigDecimal("1000")).maxPrice(new BigDecimal("3000")).build(), null))
                .containsExactlyInAnyOrder("Premium Silk Curtain", "Wooden Blind");
        assertThat(names(filter().inStock(true).build(), null))
                .containsExactlyInAnyOrder("Velvet Curtain", "Premium Silk Curtain");
    }

    @Test
    @DisplayName("Price sorts use the offer price when there is one")
    void sortsByEffectivePrice() {
        assertThat(names(filter().build(), "price_asc"))
                .containsExactly("Premium Silk Curtain", "Wooden Blind", "Velvet Curtain");
        assertThat(names(filter().build(), "price_desc"))
                .containsExactly("Velvet Curtain", "Wooden Blind", "Premium Silk Curtain");
    }

    @Test
    @DisplayName("Popularity puts flagged products first; relevance ranks name matches first")
    void sortsByPopularityAndRelevance() {
        assertThat(names(filter().build(), "popularity").get(0)).isEqualTo("Premium Silk Curtain");
        // No sortBy + text query defaults to relevance: name starts with "velvet" beats the others.
        assertThat(names(filter().query("velvet").build(), null))
                .containsExactly("Velvet Curtain");
        assertThat(names(filter().query("curtain").build(), null))
                .containsExactlyInAnyOrder("Velvet Curtain", "Premium Silk Curtain");
    }

    @Test
    @DisplayName("Text search also matches translated product names")
    void searchMatchesTranslations() {
        translatedContentRepository.save(new TranslatedContent("PRODUCT", blind.getId(), "name", "hi", "लकड़ी का ब्लाइंड"));
        assertThat(names(filter().query("ब्लाइंड").build(), null)).containsExactly("Wooden Blind");
    }

    @Test
    @DisplayName("Pages never repeat or skip products when many share the same sort value")
    void paginationIsStable() {
        for (int i = 0; i < 25; i++) {
            save(product("Plain Track " + i, "TRK-" + i, 3L, "Aluminium", "[]", "[]", "500", null, 1));
        }
        ProductFilterRequest request = filter().categoryId(3L).build();
        List<Long> seen = new ArrayList<>();
        for (int page = 0; page < 3; page++) {
            Page<Product> result = productRepository.findAll(
                    ProductSpecifications.fromFilter(request)
                            .and(ProductSpecifications.orderedBy("featured", null)),
                    PageRequest.of(page, 10));
            assertThat(result.getTotalElements()).isEqualTo(25);
            result.forEach(p -> seen.add(p.getId()));
        }
        assertThat(seen).hasSize(25).doesNotHaveDuplicates();
    }

    private List<String> names(ProductFilterRequest request, String sortBy) {
        return productRepository.findAll(
                        ProductSpecifications.fromFilter(request)
                                .and(ProductSpecifications.orderedBy(sortBy, request.getQuery())),
                        PageRequest.of(0, 50))
                .map(Product::getName)
                .getContent();
    }

    private ProductFilterRequest.ProductFilterRequestBuilder filter() {
        return ProductFilterRequest.builder().status(ProductStatus.ACTIVE);
    }

    private Product save(Product product) {
        return productRepository.saveAndFlush(product);
    }

    private Product product(String name, String sku, Long categoryId, String material, String colors,
                            String sizes, String basePrice, String offerPrice, int stock) {
        Product p = new Product();
        p.setName(name);
        p.setSku(sku);
        p.setCategoryId(categoryId);
        p.setMaterial(material);
        p.setColors(colors);
        p.setSizes(sizes);
        p.setBasePrice(new BigDecimal(basePrice));
        p.setOfferPrice(offerPrice == null ? null : new BigDecimal(offerPrice));
        p.setStockQuantity(stock);
        p.setStatus(ProductStatus.ACTIVE);
        return p;
    }
}
