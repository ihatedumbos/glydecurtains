package com.glydecurtains.controller;

import com.glydecurtains.security.RequiresPermission;
import com.glydecurtains.service.CatalogueService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;

/**
 * Public catalogue downloads: the PDF customers get on WhatsApp, the product feed Meta reads
 * for the WhatsApp Business catalogue, and the product photos that feed links to.
 */
@RestController
@RequestMapping("/api/catalogue")
@RequiredArgsConstructor
public class CatalogueController {

    /** Building the PDF resizes every photo, so keep the last one for a few minutes. */
    private static final Duration PDF_CACHE_TIME = Duration.ofMinutes(10);

    private final CatalogueService catalogueService;

    @Value("${app.storefront-url:https://glydecurtains.com}")
    private String storefrontUrl;

    private byte[] cachedPdf;
    private Instant cachedPdfAt = Instant.EPOCH;

    @GetMapping(value = "/glyde-catalogue.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> pdf() {
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.inline().filename("Glyde-catalogue.pdf").build().toString())
                .cacheControl(CacheControl.maxAge(PDF_CACHE_TIME).cachePublic())
                .body(currentPdf());
    }

    /**
     * Admin "Create catalogue PDF" button: builds the PDF now from the current products (skipping
     * the cache), returns it for download, and makes it the one customers get from the website.
     */
    @PostMapping(value = "/refresh", produces = MediaType.APPLICATION_PDF_VALUE)
    @RequiresPermission(entity = "products", operation = "UPDATE")
    public ResponseEntity<byte[]> refresh() {
        byte[] pdf = rebuildPdf();
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename("Glyde-catalogue.pdf").build().toString())
                .cacheControl(CacheControl.noStore())
                .body(pdf);
    }

    private synchronized byte[] rebuildPdf() {
        cachedPdf = catalogueService.cataloguePdf(storefront());
        cachedPdfAt = Instant.now();
        return cachedPdf;
    }

    private synchronized byte[] currentPdf() {
        if (cachedPdf == null || Instant.now().isAfter(cachedPdfAt.plus(PDF_CACHE_TIME))) {
            return rebuildPdf();
        }
        return cachedPdf;
    }

    /** Paste this URL into Meta Commerce Manager as a scheduled data feed (daily). */
    @GetMapping("/whatsapp-feed.csv")
    public ResponseEntity<String> metaFeed(HttpServletRequest request) {
        return ResponseEntity.ok()
                .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
                .cacheControl(CacheControl.maxAge(Duration.ofMinutes(30)).cachePublic())
                .body(catalogueService.metaFeedCsv(storefront(), apiBaseUrl(request)));
    }

    @GetMapping("/images/{id}.jpg")
    public ResponseEntity<byte[]> image(@PathVariable Long id) {
        return catalogueService.imageBytes(id)
                .map(bytes -> ResponseEntity.ok()
                        .contentType(MediaType.IMAGE_JPEG)
                        .cacheControl(CacheControl.maxAge(Duration.ofDays(1)).cachePublic())
                        .body(bytes))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    private String storefront() {
        return storefrontUrl.replaceAll("/+$", "");
    }

    /** This backend's public address. Render terminates HTTPS in front of the app, so trust its forwarded scheme. */
    static String apiBaseUrl(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-Proto");
        String scheme = forwarded != null && !forwarded.isBlank() ? forwarded.split(",")[0].trim() : request.getScheme();
        String host = request.getHeader(HttpHeaders.HOST);
        if (host == null || host.isBlank()) host = request.getServerName() + ":" + request.getServerPort();
        return scheme + "://" + host;
    }
}
