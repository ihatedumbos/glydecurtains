package com.glydecurtains.service;

import com.glydecurtains.entity.Category;
import com.glydecurtains.entity.Product;
import com.glydecurtains.entity.ProductSpecification;
import com.glydecurtains.entity.ProductVariant;
import com.glydecurtains.entity.SubCategory;
import com.glydecurtains.exception.BusinessException;
import com.glydecurtains.repository.CategoryRepository;
import com.glydecurtains.repository.ProductRepository;
import com.glydecurtains.repository.SubCategoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyIterable;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class SupplierQuoteServiceTest {

    @Mock private ProductRepository productRepository;
    @Mock private CategoryRepository categoryRepository;
    @Mock private SubCategoryRepository subCategoryRepository;

    private SupplierQuoteService service;

    @BeforeEach
    void setUp() {
        ClassLoaderTemplateResolver resolver = new ClassLoaderTemplateResolver();
        resolver.setPrefix("templates/");
        resolver.setSuffix(".html");
        SpringTemplateEngine engine = new SpringTemplateEngine();
        engine.setTemplateResolver(resolver);
        service = new SupplierQuoteService(productRepository, categoryRepository, subCategoryRepository, engine);

        Category tracks = new Category();
        tracks.setId(2L);
        tracks.setName("Tracks");
        tracks.setSortOrder(1);
        Category accessories = new Category();
        accessories.setId(1L);
        accessories.setName("Accessories");
        accessories.setSortOrder(2);
        SubCategory runners = new SubCategory();
        runners.setId(5L);
        runners.setName("Track Runners");
        when(categoryRepository.findAll()).thenReturn(List.of(accessories, tracks));
        when(subCategoryRepository.findAll()).thenReturn(List.of(runners));

        Product runner = product(1L, "Jumbo Runner", "GLYDE-RUN", 1L, "549");
        runner.setSubCategoryId(5L);
        spec(runner, "Wheel diameter", "12 mm", 1, true);
        spec(runner, "Weight", "4 g", 0, true);

        Product track = product(2L, "E101 Curtain Track", "GLYDE-E101", 2L, "0");
        track.setInternalName("E101 heavy");
        track.setColors("[\"Ivory\",\"White\"]");
        ProductVariant v = new ProductVariant();
        v.setProduct(track);
        v.setSize("8 ft");
        v.setPrice(new BigDecimal("900"));
        track.setVariants(List.of(v));
        spec(track, "Combined weight per metre", "450 g", 2, true);
        spec(track, "PVC insert weight", "=70 g", 1, false);

        when(productRepository.findAllById(anyIterable())).thenReturn(List.of(runner, track));
    }

    @Test
    void csvHasOneColumnPerSpecificationIncludingHiddenOnes() {
        String csv = new String(service.csv(List.of(1L, 2L), false), StandardCharsets.UTF_8);
        String[] rows = csv.substring(1).split("\r\n");

        assertTrue(csv.startsWith("﻿"), "Excel needs the byte-order mark to read UTF-8");
        assertEquals("\"No.\",\"Code\",\"Product\",\"Category\",\"Sizes\",\"Colours\",\"PVC insert weight\",\"Combined weight per metre\","
                + "\"Weight\",\"Wheel diameter\",\"Your rate (Rs.)\",\"Rate per (piece / metre / set)\",\"Remarks\"", rows[0]);
        assertEquals("\"1\",\"GLYDE-E101\",\"E101 Curtain Track (E101 heavy)\",\"Tracks\",\"8 ft\",\"Ivory, White\",\"'=70 g\",\"450 g\",\"\",\"\",\"\",\"\",\"\"", rows[1],
                "tracks first by category order; formula-like values are made safe; hidden rows are still listed");
        assertEquals("\"2\",\"GLYDE-RUN\",\"Jumbo Runner\",\"Accessories > Track Runners\",\"\",\"\",\"\",\"\",\"4 g\",\"12 mm\",\"\",\"\",\"\"", rows[2]);
        assertFalse(csv.contains("Our price"));
    }

    @Test
    void pricesOnlyWhenAskedFor() {
        String csv = new String(service.csv(List.of(1L, 2L), true), StandardCharsets.UTF_8);
        assertTrue(csv.contains("\"Our price\""));
        assertTrue(csv.contains("\"Rs. 900\""));
        assertTrue(csv.contains("\"Rs. 549\""));
    }

    @Test
    void pdfRenders() {
        byte[] pdf = service.pdf(List.of(1L, 2L), false, "Shree Metals", "Rates for 100 pieces & more");
        assertTrue(pdf.length > 1000);
        assertEquals("%PDF", new String(pdf, 0, 4, StandardCharsets.US_ASCII));
    }

    @Test
    void needsAtLeastOneProduct() {
        assertThrows(BusinessException.class, () -> service.csv(List.of(), false));
    }

    private static Product product(Long id, String name, String sku, Long categoryId, String price) {
        Product p = new Product();
        p.setId(id);
        p.setName(name);
        p.setSku(sku);
        p.setCategoryId(categoryId);
        p.setBasePrice(new BigDecimal(price));
        return p;
    }

    private static void spec(Product p, String key, String value, int order, boolean shown) {
        ProductSpecification s = new ProductSpecification();
        s.setProduct(p);
        s.setSpecKey(key);
        s.setSpecValue(value);
        s.setSortOrder(order);
        s.setShowToCustomers(shown);
        p.getSpecifications().add(s);
    }
}
