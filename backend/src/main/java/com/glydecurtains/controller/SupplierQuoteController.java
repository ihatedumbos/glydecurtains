package com.glydecurtains.controller;

import com.glydecurtains.security.RequiresPermission;
import com.glydecurtains.service.SupplierQuoteService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;

/** Admin download: the quotation sheet the shop sends to suppliers (PDF or CSV). */
@RestController
@RequestMapping("/api/products/supplier-quote")
@RequiredArgsConstructor
public class SupplierQuoteController {

    private final SupplierQuoteService supplierQuoteService;

    @Data
    public static class QuoteRequest {
        private List<Long> productIds;
        private boolean includePrices;
        private String supplierName;
        private String note;
    }

    @PostMapping(value = "/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @RequiresPermission(entity = "products", operation = "READ")
    public ResponseEntity<byte[]> pdf(@RequestBody QuoteRequest request) {
        byte[] pdf = supplierQuoteService.pdf(request.getProductIds(), request.isIncludePrices(),
                request.getSupplierName(), request.getNote());
        return download(pdf, MediaType.APPLICATION_PDF, "pdf");
    }

    @PostMapping("/csv")
    @RequiresPermission(entity = "products", operation = "READ")
    public ResponseEntity<byte[]> csv(@RequestBody QuoteRequest request) {
        byte[] csv = supplierQuoteService.csv(request.getProductIds(), request.isIncludePrices());
        return download(csv, new MediaType("text", "csv", StandardCharsets.UTF_8), "csv");
    }

    private static ResponseEntity<byte[]> download(byte[] body, MediaType type, String extension) {
        String filename = "Glyde-quotation-request-" + LocalDate.now() + "." + extension;
        return ResponseEntity.ok()
                .contentType(type)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(filename).build().toString())
                .cacheControl(CacheControl.noStore())
                .body(body);
    }
}
