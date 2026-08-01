package com.glydecurtains.service.impl;

import com.glydecurtains.dto.request.OrderFilterRequest;
import com.glydecurtains.dto.request.OrderPlaceRequest;
import com.glydecurtains.dto.request.OrderStatusUpdateRequest;
import com.glydecurtains.dto.response.*;
import com.glydecurtains.entity.*;
import com.glydecurtains.entity.enums.OrderStatus;
import com.glydecurtains.exception.BusinessException;
import com.glydecurtains.repository.*;
import com.glydecurtains.service.ActivityLogService;
import com.glydecurtains.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private static final Map<OrderStatus, Set<OrderStatus>> VALID_TRANSITIONS = Map.of(
            OrderStatus.PENDING, Set.of(OrderStatus.CONFIRMED, OrderStatus.CANCELLED),
            OrderStatus.CONFIRMED, Set.of(OrderStatus.PACKED, OrderStatus.CANCELLED),
            OrderStatus.PACKED, Set.of(OrderStatus.DISPATCHED),
            OrderStatus.DISPATCHED, Set.of(OrderStatus.DELIVERED)
    );

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final OrderStatusHistoryRepository orderStatusHistoryRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;
    private final UserRepository userRepository;
    private final ActivityLogService activityLogService;

    @Override
    @Transactional
    public OrderResponse placeOrder(OrderPlaceRequest request) {
        Long userId = getCurrentUserId();

        Cart cart = cartRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException("Cart not found", "CART_NOT_FOUND", HttpStatus.NOT_FOUND));

        if (cart.getItems() == null || cart.getItems().isEmpty()) {
            throw new BusinessException("Cart is empty", "CART_EMPTY");
        }

        // Create the order
        Order order = new Order();
        order.setUserId(userId);
        order.setStatus(OrderStatus.PENDING);
        order.setOrderNumber(generateOrderNumber());

        BigDecimal subtotal = BigDecimal.ZERO;

        // Process each cart item
        for (CartItem cartItem : cart.getItems()) {
            Product product = productRepository.findById(cartItem.getProductId())
                    .orElseThrow(() -> new BusinessException("Product not found: " + cartItem.getProductId(), "PRODUCT_NOT_FOUND", HttpStatus.NOT_FOUND));

            // Validate stock and deduct
            deductStock(product, cartItem.getVariantId(), cartItem.getQuantity());

            // Create order item with snapshot data
            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProductId(product.getId());
            orderItem.setVariantId(cartItem.getVariantId());
            orderItem.setProductName(product.getName());
            orderItem.setQuantity(cartItem.getQuantity());
            orderItem.setUnitPrice(cartItem.getUnitPrice());
            orderItem.setSubtotal(cartItem.getUnitPrice().multiply(BigDecimal.valueOf(cartItem.getQuantity())));

            order.getItems().add(orderItem);
            subtotal = subtotal.add(orderItem.getSubtotal());
        }

        order.setSubtotal(subtotal);
        order.setGrandTotal(subtotal); // No tax/shipping in Phase 1

        Order savedOrder = orderRepository.save(order);

        // Record initial status history
        recordStatusChange(savedOrder, null, OrderStatus.PENDING, userId, "Order placed");

        // Log activity
        activityLogService.log(userId, "ORDER_PLACED", "ORDER", savedOrder.getId(),
                String.format("{\"orderNumber\":\"%s\",\"grandTotal\":\"%s\",\"itemCount\":%d}",
                        savedOrder.getOrderNumber(), savedOrder.getGrandTotal(), savedOrder.getItems().size()));

        // Clear cart
        cart.getItems().clear();
        cartRepository.save(cart);

        return toOrderResponse(savedOrder);
    }

    @Override
    @Transactional
    public OrderResponse updateStatus(Long orderId, OrderStatusUpdateRequest request) {
        Long userId = getCurrentUserId();

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException("Order not found", "ORDER_NOT_FOUND", HttpStatus.NOT_FOUND));

        OrderStatus currentStatus = order.getStatus();
        OrderStatus newStatus = request.getStatus();

        // Validate transition
        Set<OrderStatus> allowedTransitions = VALID_TRANSITIONS.get(currentStatus);
        if (allowedTransitions == null || !allowedTransitions.contains(newStatus)) {
            throw new BusinessException(
                    "Invalid status transition from " + currentStatus + " to " + newStatus,
                    "INVALID_STATUS_TRANSITION");
        }

        order.setStatus(newStatus);
        Order savedOrder = orderRepository.save(order);

        recordStatusChange(savedOrder, currentStatus, newStatus, userId, request.getNotes());

        // Log activity
        activityLogService.log(userId, "ORDER_STATUS_UPDATED", "ORDER", orderId,
                String.format("{\"orderNumber\":\"%s\",\"fromStatus\":\"%s\",\"toStatus\":\"%s\"}",
                        order.getOrderNumber(), currentStatus, newStatus));

        return toOrderResponse(savedOrder);
    }

    @Override
    @Transactional
    public OrderResponse cancelOrder(Long orderId) {
        Long userId = getCurrentUserId();

        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException("Order not found", "ORDER_NOT_FOUND", HttpStatus.NOT_FOUND));

        // Only allow cancel from PENDING or CONFIRMED
        if (order.getStatus() != OrderStatus.PENDING && order.getStatus() != OrderStatus.CONFIRMED) {
            throw new BusinessException(
                    "Order can only be cancelled from Pending or Confirmed status",
                    "CANCEL_NOT_ALLOWED");
        }

        OrderStatus previousStatus = order.getStatus();
        order.setStatus(OrderStatus.CANCELLED);

        // Restore stock for all items
        for (OrderItem item : order.getItems()) {
            restoreStock(item.getProductId(), item.getVariantId(), item.getQuantity());
        }

        Order savedOrder = orderRepository.save(order);
        recordStatusChange(savedOrder, previousStatus, OrderStatus.CANCELLED, userId, "Order cancelled");

        // Log activity
        activityLogService.log(userId, "ORDER_CANCELLED", "ORDER", orderId,
                String.format("{\"orderNumber\":\"%s\",\"previousStatus\":\"%s\"}",
                        order.getOrderNumber(), previousStatus));

        return toOrderResponse(savedOrder);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderDetailResponse getOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException("Order not found", "ORDER_NOT_FOUND", HttpStatus.NOT_FOUND));

        return toOrderDetailResponse(order);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> getMyOrders(Pageable pageable) {
        Long userId = getCurrentUserId();
        Page<Order> page = orderRepository.findByUserId(userId, pageable);
        return PageResponse.from(page.map(this::toOrderResponse));
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<OrderResponse> getAllOrders(OrderFilterRequest filter, Pageable pageable) {
        LocalDateTime dateFrom = filter.getDateFrom() != null
                ? filter.getDateFrom().atStartOfDay()
                : null;
        LocalDateTime dateTo = filter.getDateTo() != null
                ? filter.getDateTo().atTime(LocalTime.MAX)
                : null;

        Page<Order> page = orderRepository.findAllWithFilters(
                filter.getStatus(),
                filter.getCustomerId(),
                dateFrom,
                dateTo,
                filter.getOrderNumber(),
                pageable);

        return PageResponse.from(page.map(this::toOrderResponse));
    }

    @Override
    @Transactional
    public OrderResponse assignEmployee(Long orderId, Long employeeId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException("Order not found", "ORDER_NOT_FOUND", HttpStatus.NOT_FOUND));

        // Validate employee exists
        userRepository.findById(employeeId)
                .orElseThrow(() -> new BusinessException("Employee not found", "EMPLOYEE_NOT_FOUND", HttpStatus.NOT_FOUND));

        order.setAssignedEmployeeId(employeeId);
        Order savedOrder = orderRepository.save(order);

        return toOrderResponse(savedOrder);
    }

    // --- Private helpers ---

    private String generateOrderNumber() {
        LocalDate today = LocalDate.now();
        String datePart = String.format("%04d%02d%02d", today.getYear(), today.getMonthValue(), today.getDayOfMonth());

        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime startOfNextDay = today.plusDays(1).atStartOfDay();
        long countToday = orderRepository.countOrdersForDay(startOfDay, startOfNextDay);

        String sequencePart = String.format("%04d", countToday + 1);
        return "GC-" + datePart + "-" + sequencePart;
    }

    private void deductStock(Product product, Long variantId, int quantity) {
        if (variantId != null) {
            ProductVariant variant = productVariantRepository.findById(variantId)
                    .orElseThrow(() -> new BusinessException("Product variant not found", "VARIANT_NOT_FOUND", HttpStatus.NOT_FOUND));

            int available = variant.getStockQuantity() != null ? variant.getStockQuantity() : 0;
            if (quantity > available) {
                throw new BusinessException(
                        "Insufficient stock for variant of " + product.getName() + ". Available: " + available,
                        "INSUFFICIENT_STOCK");
            }
            variant.setStockQuantity(available - quantity);
            productVariantRepository.save(variant);
        } else {
            int available = product.getStockQuantity();
            if (quantity > available) {
                throw new BusinessException(
                        "Insufficient stock for " + product.getName() + ". Available: " + available,
                        "INSUFFICIENT_STOCK");
            }
            product.setStockQuantity(available - quantity);
            productRepository.save(product);
        }
    }

    private void restoreStock(Long productId, Long variantId, int quantity) {
        if (variantId != null) {
            productVariantRepository.findById(variantId).ifPresent(variant -> {
                int current = variant.getStockQuantity() != null ? variant.getStockQuantity() : 0;
                variant.setStockQuantity(current + quantity);
                productVariantRepository.save(variant);
            });
        } else {
            productRepository.findById(productId).ifPresent(product -> {
                product.setStockQuantity(product.getStockQuantity() + quantity);
                productRepository.save(product);
            });
        }
    }

    private void recordStatusChange(Order order, OrderStatus fromStatus, OrderStatus toStatus, Long changedBy, String notes) {
        OrderStatusHistory history = new OrderStatusHistory();
        history.setOrder(order);
        history.setFromStatus(fromStatus);
        history.setToStatus(toStatus);
        history.setChangedBy(changedBy);
        history.setChangedAt(LocalDateTime.now());
        history.setNotes(notes);
        orderStatusHistoryRepository.save(history);
    }

    private OrderResponse toOrderResponse(Order order) {
        return OrderResponse.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .userId(order.getUserId())
                .status(order.getStatus())
                .subtotal(order.getSubtotal())
                .grandTotal(order.getGrandTotal())
                .assignedEmployeeId(order.getAssignedEmployeeId())
                .itemCount(order.getItems() != null ? order.getItems().size() : 0)
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }

    private OrderDetailResponse toOrderDetailResponse(Order order) {
        List<OrderItemResponse> itemResponses = order.getItems().stream()
                .map(this::toOrderItemResponse)
                .collect(Collectors.toList());

        List<OrderStatusHistoryResponse> historyResponses = order.getStatusHistory().stream()
                .map(this::toStatusHistoryResponse)
                .collect(Collectors.toList());

        return OrderDetailResponse.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .userId(order.getUserId())
                .status(order.getStatus())
                .subtotal(order.getSubtotal())
                .grandTotal(order.getGrandTotal())
                .assignedEmployeeId(order.getAssignedEmployeeId())
                .items(itemResponses)
                .statusHistory(historyResponses)
                .createdAt(order.getCreatedAt())
                .updatedAt(order.getUpdatedAt())
                .build();
    }

    private OrderItemResponse toOrderItemResponse(OrderItem item) {
        return OrderItemResponse.builder()
                .id(item.getId())
                .productId(item.getProductId())
                .variantId(item.getVariantId())
                .productName(item.getProductName())
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .subtotal(item.getSubtotal())
                .build();
    }

    private OrderStatusHistoryResponse toStatusHistoryResponse(OrderStatusHistory history) {
        return OrderStatusHistoryResponse.builder()
                .id(history.getId())
                .fromStatus(history.getFromStatus())
                .toStatus(history.getToStatus())
                .changedBy(history.getChangedBy())
                .changedAt(history.getChangedAt())
                .notes(history.getNotes())
                .build();
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Long) {
            return (Long) authentication.getPrincipal();
        }
        throw new BusinessException("User not authenticated", "UNAUTHENTICATED", HttpStatus.UNAUTHORIZED);
    }
}
