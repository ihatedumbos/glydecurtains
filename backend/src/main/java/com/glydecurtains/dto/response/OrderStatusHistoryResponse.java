package com.glydecurtains.dto.response;

import com.glydecurtains.entity.enums.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderStatusHistoryResponse {

    private Long id;
    private OrderStatus fromStatus;
    private OrderStatus toStatus;
    private Long changedBy;
    private LocalDateTime changedAt;
    private String notes;
}
