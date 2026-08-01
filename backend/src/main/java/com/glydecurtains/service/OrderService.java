package com.glydecurtains.service;

import com.glydecurtains.dto.request.OrderFilterRequest;
import com.glydecurtains.dto.request.OrderPlaceRequest;
import com.glydecurtains.dto.request.OrderStatusUpdateRequest;
import com.glydecurtains.dto.response.OrderDetailResponse;
import com.glydecurtains.dto.response.OrderResponse;
import com.glydecurtains.dto.response.PageResponse;
import org.springframework.data.domain.Pageable;

public interface OrderService {

    OrderResponse placeOrder(OrderPlaceRequest request);

    OrderResponse updateStatus(Long orderId, OrderStatusUpdateRequest request);

    OrderResponse cancelOrder(Long orderId);

    OrderDetailResponse getOrder(Long orderId);

    PageResponse<OrderResponse> getMyOrders(Pageable pageable);

    PageResponse<OrderResponse> getAllOrders(OrderFilterRequest filter, Pageable pageable);

    OrderResponse assignEmployee(Long orderId, Long employeeId);
}
