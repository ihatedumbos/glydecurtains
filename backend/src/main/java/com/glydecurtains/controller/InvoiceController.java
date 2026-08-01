package com.glydecurtains.controller;

import com.glydecurtains.dto.request.BulkInvoiceRequest;
import com.glydecurtains.dto.request.InvoiceSettingsUpdateRequest;
import com.glydecurtains.dto.response.*;
import com.glydecurtains.security.RequiresPermission;
import com.glydecurtains.service.InvoiceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;

    @PostMapping("/orders/{orderId}/generate")
    @RequiresPermission(entity = "invoices", operation = "CREATE")
    public ResponseEntity<ApiResponse<InvoiceResponse>> generateInvoice(@PathVariable Long orderId) {
        InvoiceResponse response = invoiceService.generateInvoice(orderId);
        return ResponseEntity.status(201).body(ApiResponse.created("Invoice generated successfully", response));
    }

    @GetMapping("/orders/{orderId}")
    @RequiresPermission(entity = "invoices", operation = "READ")
    public ResponseEntity<ApiResponse<InvoiceResponse>> getInvoice(@PathVariable Long orderId) {
        InvoiceResponse response = invoiceService.getInvoice(orderId);
        return ResponseEntity.ok(ApiResponse.success("Invoice retrieved successfully", response));
    }

    @PostMapping("/bulk-generate")
    @RequiresPermission(entity = "invoices", operation = "CREATE")
    public ResponseEntity<ApiResponse<BulkInvoiceResponse>> bulkGenerateInvoices(
            @Valid @RequestBody BulkInvoiceRequest request) {
        BulkInvoiceResponse response = invoiceService.bulkGenerateInvoices(request);
        return ResponseEntity.ok(ApiResponse.success("Bulk invoice generation completed", response));
    }

    @GetMapping("/settings")
    @RequiresPermission(entity = "invoices", operation = "READ")
    public ResponseEntity<ApiResponse<InvoiceSettingsResponse>> getSettings() {
        InvoiceSettingsResponse response = invoiceService.getSettings();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/settings")
    @RequiresPermission(entity = "invoices", operation = "UPDATE")
    public ResponseEntity<ApiResponse<InvoiceSettingsResponse>> updateSettings(
            @Valid @RequestBody InvoiceSettingsUpdateRequest request) {
        InvoiceSettingsResponse response = invoiceService.updateSettings(request);
        return ResponseEntity.ok(ApiResponse.success("Invoice settings updated successfully", response));
    }
}
