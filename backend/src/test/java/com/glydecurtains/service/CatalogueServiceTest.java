package com.glydecurtains.service;

import com.glydecurtains.entity.Category;
import com.glydecurtains.entity.Product;
import com.glydecurtains.entity.ProductImage;
import com.glydecurtains.entity.ProductVariant;
import com.glydecurtains.entity.enums.ProductStatus;
import com.glydecurtains.repository.CategoryRepository;
import com.glydecurtains.repository.ProductImageRepository;
import com.glydecurtains.repository.ProductRepository;
import com.glydecurtains.repository.SiteSettingsRepository;
import com.glydecurtains.repository.SubCategoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.thymeleaf.TemplateEngine;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CatalogueServiceTest {

    @Mock private ProductRepository productRepository;
    @Mock private ProductImageRepository productImageRepository;
    @Mock private CategoryRepository categoryRepository;
    @Mock private SubCategoryRepository subCategoryRepository;
    @Mock private SiteSettingsRepository siteSettingsRepository;
    @Mock private TemplateEngine templateEngine;

    @InjectMocks
    private CatalogueService service;

    private Product runner;
    private Product track;
    private Product noPhoto;

    @BeforeEach
    void setUp() {
        Category accessories = new Category();
        accessories.setId(1L);
        accessories.setName("Accessories");
        accessories.setSortOrder(2);
        Category tracks = new Category();
        tracks.setId(2L);
        tracks.setName("Tracks");
        tracks.setSortOrder(1);
        when(categoryRepository.findAll()).thenReturn(List.of(accessories, tracks));
        when(subCategoryRepository.findAll()).thenReturn(List.of());

        runner = product(1L, "Jumbo Runner", "GLYDE-RUN", 1L, "549");
        runner.setShortDescription("Smooth \"silent\" runner,\nfor heavy curtains.");
        track = product(2L, "E101 Curtain Track", "GLYDE-E101", 2L, "0");
        track.setColors("[\"Ivory\",\"White\"]");
        track.setVariants(List.of(variant(track, "4 ft", "450"), variant(track, "8 ft", "900")));
        noPhoto = product(3L, "Ripple Tape", "GLYDE-TAPE", 1L, "249");
        when(productRepository.findByStatus(ProductStatus.ACTIVE)).thenReturn(List.of(noPhoto, runner, track));

        when(productImageRepository.findByProductIdOrderBySortOrderAsc(1L)).thenReturn(List.of(image(11L, "/products/accessories/20%23Ceiling/a.jpg")));
        when(productImageRepository.findByProductIdOrderBySortOrderAsc(2L)).thenReturn(List.of(image(12L, "/products/tracks/E101.jpg")));
        when(productImageRepository.findByProductIdOrderBySortOrderAsc(3L)).thenReturn(List.of(image(13L, "/products/accessories/placeholder/photo-coming-soon.jpg")));
    }

    @Test
    void ordersByCategoryThenPhotosFirst() {
        List<CatalogueService.CatalogueItem> items = service.items();

        assertEquals(List.of("E101 Curtain Track", "Jumbo Runner", "Ripple Tape"),
                items.stream().map(i -> i.product().getName()).toList());
        assertNull(items.get(2).photo(), "placeholder images do not count as photos");
        assertEquals("Rs. 450 to Rs. 900", items.get(0).priceText());
        assertEquals(List.of("4 ft", "8 ft"), items.get(0).sizes());
        assertEquals(List.of("Ivory", "White"), items.get(0).colors());
    }

    @Test
    void metaFeedListsPricedProductsWithPhotos() {
        String csv = service.metaFeedCsv("https://glydecurtains.com", "https://api.example.com");
        String[] lines = csv.split("\n");

        assertEquals("id,title,description,availability,condition,price,link,image_link,brand,product_type", lines[0]);
        assertEquals(3, lines.length, "the product without a photo is left out");
        assertTrue(lines[1].startsWith("\"GLYDE-E101\",\"E101 Curtain Track\""));
        assertTrue(lines[1].contains("\"450.00 INR\""));
        assertTrue(lines[1].contains("Price depends on size: Rs. 450 to Rs. 900."));
        assertTrue(lines[1].contains("\"https://api.example.com/api/catalogue/images/12.jpg\""));
        assertTrue(lines[2].contains("\"Smooth \"\"silent\"\" runner, for heavy curtains.\""), "quotes escaped, new lines removed");
        assertTrue(lines[2].contains("\"https://glydecurtains.com/products/1\""));
    }

    private static Product product(Long id, String name, String sku, Long categoryId, String price) {
        Product p = new Product();
        p.setId(id);
        p.setName(name);
        p.setSku(sku);
        p.setCategoryId(categoryId);
        p.setBasePrice(new BigDecimal(price));
        p.setStatus(ProductStatus.ACTIVE);
        return p;
    }

    private static ProductVariant variant(Product product, String size, String price) {
        ProductVariant v = new ProductVariant();
        v.setProduct(product);
        v.setSize(size);
        v.setPrice(new BigDecimal(price));
        return v;
    }

    private static ProductImage image(Long id, String path) {
        ProductImage img = new ProductImage();
        img.setId(id);
        img.setBase64Data(path);
        img.setIsThumbnail(true);
        return img;
    }
}
