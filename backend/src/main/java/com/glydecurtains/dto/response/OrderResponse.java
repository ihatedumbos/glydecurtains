package com.glydecurtains.dto.response;

import com.glydecurtains.entity.enums.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {

    private Long id;
    private String orderNumber;
    private Long userId;
    private OrderStatus status;
    private BigDecimal subtotal;
    private BigDecimal grandTotal;
    private Long assignedEmployeeId;
    private int itemCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
