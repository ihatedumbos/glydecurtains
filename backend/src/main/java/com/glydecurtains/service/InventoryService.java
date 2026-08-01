package com.glydecurtains.service;

import com.glydecurtains.dto.request.StockAdjustmentRequest;
import com.glydecurtains.dto.request.ThresholdUpdateRequest;
import com.glydecurtains.dto.response.PageResponse;
import com.glydecurtains.dto.response.StockAdjustmentResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface InventoryService {

    StockAdjustmentResponse adjustStock(StockAdjustmentRequest request);

    PageResponse<StockAdjustmentResponse> getAdjustmentHistory(Long productId, Pageable pageable);

    void updateLowStockThreshold(Long productId, ThresholdUpdateRequest request);

    List<StockAdjustmentResponse> bulkAdjustStock(List<StockAdjustmentRequest> requests);

    List<StockAdjustmentResponse> bulkAdjustFromCsv(MultipartFile file);
}
