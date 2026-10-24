package com.glydecurtains.controller;

import com.glydecurtains.entity.Product;
import com.glydecurtains.entity.enums.ProductStatus;
import com.glydecurtains.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

/**
 * Sitemap for search engines: the public storefront pages and every active product page.
 * The storefront's robots.txt points here, so new products reach Google without a redeploy.
 */
@RestController
@RequiredArgsConstructor
public class SitemapController {

    private static final List<String> STATIC_PAGES = List.of(
            "/", "/products", "/about", "/contact", "/stores",
            "/pages/about-us", "/pages/privacy-policy", "/pages/terms-and-conditions");

    private final ProductRepository productRepository;

    @Value("${app.storefront-url:https://glydecurtains.com}")
    private String storefrontUrl;

    @GetMapping(value = "/api/sitemap.xml", produces = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<String> sitemap() {
        String base = storefrontUrl.replaceAll("/+$", "");
        StringBuilder xml = new StringBuilder("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n")
                .append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n");
        STATIC_PAGES.forEach(path -> appendUrl(xml, base + path, null));
        productRepository.findByStatus(ProductStatus.ACTIVE).stream()
                .sorted(Comparator.comparing(Product::getId))
                .forEach(p -> appendUrl(xml, base + "/products/" + p.getId(), p.getUpdatedAt()));
        xml.append("</urlset>\n");
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(Duration.ofHours(1)).cachePublic())
                .contentType(MediaType.APPLICATION_XML)
                .body(xml.toString());
    }

    private static void appendUrl(StringBuilder xml, String loc, LocalDateTime lastModified) {
        xml.append("  <url><loc>").append(loc).append("</loc>");
        if (lastModified != null) {
            xml.append("<lastmod>").append(lastModified.toLocalDate()).append("</lastmod>");
        }
        xml.append("</url>\n");
    }
}
