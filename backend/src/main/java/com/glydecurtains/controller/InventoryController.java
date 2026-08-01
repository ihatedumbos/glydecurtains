package com.glydecurtains.controller;

import com.glydecurtains.dto.request.StockAdjustmentRequest;
import com.glydecurtains.dto.request.ThresholdUpdateRequest;
import com.glydecurtains.dto.response.ApiResponse;
import com.glydecurtains.dto.response.PageResponse;
import com.glydecurtains.dto.response.StockAdjustmentResponse;
import com.glydecurtains.security.RequiresPermission;
import com.glydecurtains.service.InventoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    @PostMapping("/adjust")
    @RequiresPermission(entity = "inventory", operation = "CREATE")
    public ResponseEntity<ApiResponse<StockAdjustmentResponse>> adjustStock(
            @Valid @RequestBody StockAdjustmentRequest request) {
        StockAdjustmentResponse response = inventoryService.adjustStock(request);
        return ResponseEntity.status(201).body(ApiResponse.created("Stock adjusted successfully", response));
    }

    @GetMapping("/history/{productId}")
    @RequiresPermission(entity = "inventory", operation = "READ")
    public ResponseEntity<ApiResponse<PageResponse<StockAdjustmentResponse>>> getAdjustmentHistory(
            @PathVariable Long productId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        PageResponse<StockAdjustmentResponse> response = inventoryService.getAdjustmentHistory(productId, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/threshold/{productId}")
    @RequiresPermission(entity = "inventory", operation = "UPDATE")
    public ResponseEntity<ApiResponse<Void>> updateLowStockThreshold(
            @PathVariable Long productId,
            @Valid @RequestBody ThresholdUpdateRequest request) {
        inventoryService.updateLowStockThreshold(productId, request);
        return ResponseEntity.ok(ApiResponse.success("Low stock threshold updated successfully", null));
    }

    @PostMapping("/bulk-adjust")
    @RequiresPermission(entity = "inventory", operation = "CREATE")
    public ResponseEntity<ApiResponse<List<StockAdjustmentResponse>>> bulkAdjustStock(
            @Valid @RequestBody List<StockAdjustmentRequest> requests) {
        List<StockAdjustmentResponse> responses = inventoryService.bulkAdjustStock(requests);
        return ResponseEntity.status(201).body(ApiResponse.created("Bulk stock adjustment completed successfully", responses));
    }

    @PostMapping("/bulk-csv")
    @RequiresPermission(entity = "inventory", operation = "CREATE")
    public ResponseEntity<ApiResponse<List<StockAdjustmentResponse>>> bulkAdjustFromCsv(
            @RequestParam("file") MultipartFile file) {
        List<StockAdjustmentResponse> responses = inventoryService.bulkAdjustFromCsv(file);
        return ResponseEntity.status(201).body(ApiResponse.created("CSV bulk stock adjustment completed successfully", responses));
    }
}
