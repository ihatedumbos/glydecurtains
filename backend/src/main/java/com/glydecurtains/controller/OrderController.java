package com.glydecurtains.controller;

import com.glydecurtains.dto.request.OrderFilterRequest;
import com.glydecurtains.dto.request.OrderPlaceRequest;
import com.glydecurtains.dto.request.OrderStatusUpdateRequest;
import com.glydecurtains.dto.response.*;
import com.glydecurtains.security.RequiresPermission;
import com.glydecurtains.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<ApiResponse<OrderResponse>> placeOrder(@RequestBody(required = false) OrderPlaceRequest request) {
        if (request == null) {
            request = new OrderPlaceRequest();
        }
        OrderResponse response = orderService.placeOrder(request);
        return ResponseEntity.status(201).body(ApiResponse.created("Order placed successfully", response));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<PageResponse<OrderResponse>>> getMyOrders(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        PageResponse<OrderResponse> response = orderService.getMyOrders(pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<ApiResponse<OrderDetailResponse>> getOrder(@PathVariable Long orderId) {
        OrderDetailResponse response = orderService.getOrder(orderId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{orderId}/status")
    @RequiresPermission(entity = "orders", operation = "UPDATE")
    public ResponseEntity<ApiResponse<OrderResponse>> updateStatus(
            @PathVariable Long orderId,
            @Valid @RequestBody OrderStatusUpdateRequest request) {
        OrderResponse response = orderService.updateStatus(orderId, request);
        return ResponseEntity.ok(ApiResponse.success("Order status updated", response));
    }

    @PutMapping("/{orderId}/cancel")
    public ResponseEntity<ApiResponse<OrderResponse>> cancelOrder(@PathVariable Long orderId) {
        OrderResponse response = orderService.cancelOrder(orderId);
        return ResponseEntity.ok(ApiResponse.success("Order cancelled successfully", response));
    }

    @PutMapping("/{orderId}/assign/{employeeId}")
    @RequiresPermission(entity = "orders", operation = "UPDATE")
    public ResponseEntity<ApiResponse<OrderResponse>> assignEmployee(
            @PathVariable Long orderId,
            @PathVariable Long employeeId) {
        OrderResponse response = orderService.assignEmployee(orderId, employeeId);
        return ResponseEntity.ok(ApiResponse.success("Employee assigned to order", response));
    }

    @GetMapping
    @RequiresPermission(entity = "orders", operation = "READ")
    public ResponseEntity<ApiResponse<PageResponse<OrderResponse>>> getAllOrders(
            OrderFilterRequest filter,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        if (filter == null) {
            filter = new OrderFilterRequest();
        }
        PageResponse<OrderResponse> response = orderService.getAllOrders(filter, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
