package com.glydecurtains.dto.request;

import com.glydecurtains.entity.enums.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderFilterRequest {

    private OrderStatus status;
    private LocalDate dateFrom;
    private LocalDate dateTo;
    private Long customerId;
    private String orderNumber;
}
