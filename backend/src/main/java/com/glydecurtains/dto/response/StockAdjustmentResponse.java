package com.glydecurtains.dto.response;

import com.glydecurtains.entity.enums.AdjustmentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockAdjustmentResponse {

    private Long id;
    private Long productId;
    private AdjustmentType adjustmentType;
    private Integer quantity;
    private Integer resultingStock;
    private String reason;
    private Long performedBy;
    private LocalDateTime createdAt;
}
