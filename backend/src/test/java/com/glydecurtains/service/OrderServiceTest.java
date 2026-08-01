package com.glydecurtains.service;

import com.glydecurtains.dto.request.OrderPlaceRequest;
import com.glydecurtains.dto.request.OrderStatusUpdateRequest;
import com.glydecurtains.dto.response.OrderDetailResponse;
import com.glydecurtains.dto.response.OrderResponse;
import com.glydecurtains.entity.*;
import com.glydecurtains.entity.enums.OrderStatus;
import com.glydecurtains.exception.BusinessException;
import com.glydecurtains.repository.*;
import com.glydecurtains.service.impl.OrderServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderItemRepository orderItemRepository;

    @Mock
    private OrderStatusHistoryRepository orderStatusHistoryRepository;

    @Mock
    private CartRepository cartRepository;

    @Mock
    private CartItemRepository cartItemRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductVariantRepository productVariantRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ActivityLogService activityLogService;

    @InjectMocks
    private OrderServiceImpl orderService;

    private static final Long USER_ID = 1L;

    @BeforeEach
    void setUp() {
        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        lenient().when(authentication.getPrincipal()).thenReturn(USER_ID);
        lenient().when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
    }

    @Nested
    @DisplayName("Place Order")
    class PlaceOrderTests {

        @Test
        @DisplayName("should place order successfully with items in cart")
        void placeOrder_withItemsInCart_shouldCreateOrderAndClearCart() {
            // Arrange
            OrderPlaceRequest request = OrderPlaceRequest.builder().notes("Test order").build();

            Product product = new Product();
            product.setId(10L);
            product.setName("Velvet Curtain");
            product.setStockQuantity(50);

            CartItem cartItem = new CartItem();
            cartItem.setId(1L);
            cartItem.setProductId(10L);
            cartItem.setVariantId(null);
            cartItem.setQuantity(2);
            cartItem.setUnitPrice(BigDecimal.valueOf(1500));

            Cart cart = new Cart();
            cart.setId(1L);
            cart.setUserId(USER_ID);
            cart.setItems(new ArrayList<>(List.of(cartItem)));

            when(cartRepository.findByUserId(USER_ID)).thenReturn(Optional.of(cart));
            when(productRepository.findById(10L)).thenReturn(Optional.of(product));
            when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
                Order order = invocation.getArgument(0);
                order.setId(100L);
                order.setOrderNumber("GC-20250101-0001");
                return order;
            });
            when(orderRepository.countOrdersForDay(any(), any())).thenReturn(0L);
            when(cartRepository.save(any(Cart.class))).thenReturn(cart);

            // Act
            OrderResponse result = orderService.placeOrder(request);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo(100L);
            assertThat(result.getStatus()).isEqualTo(OrderStatus.PENDING);
            assertThat(result.getUserId()).isEqualTo(USER_ID);

            verify(productRepository).save(product);
            assertThat(product.getStockQuantity()).isEqualTo(48); // 50 - 2
            verify(orderRepository).save(any(Order.class));
            verify(orderStatusHistoryRepository).save(any(OrderStatusHistory.class));
            verify(cartRepository).save(cart);
            assertThat(cart.getItems()).isEmpty(); // cart cleared
        }

        @Test
        @DisplayName("should throw BusinessException when cart is empty")
        void placeOrder_withEmptyCart_shouldThrowBusinessException() {
            OrderPlaceRequest request = OrderPlaceRequest.builder().build();

            Cart cart = new Cart();
            cart.setId(1L);
            cart.setUserId(USER_ID);
            cart.setItems(new ArrayList<>());

            when(cartRepository.findByUserId(USER_ID)).thenReturn(Optional.of(cart));

            assertThatThrownBy(() -> orderService.placeOrder(request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Cart is empty")
                    .extracting("errorCode")
                    .isEqualTo("CART_EMPTY");

            verify(orderRepository, never()).save(any(Order.class));
        }

        @Test
        @DisplayName("should throw BusinessException when cart not found")
        void placeOrder_withNoCart_shouldThrowBusinessException() {
            OrderPlaceRequest request = OrderPlaceRequest.builder().build();

            when(cartRepository.findByUserId(USER_ID)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> orderService.placeOrder(request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Cart not found")
                    .extracting("errorCode")
                    .isEqualTo("CART_NOT_FOUND");
        }
    }

    @Nested
    @DisplayName("Update Order Status")
    class UpdateStatusTests {

        @Test
        @DisplayName("should update status for valid transition PENDING -> CONFIRMED")
        void updateStatus_validTransition_shouldUpdateSuccessfully() {
            Order order = new Order();
            order.setId(1L);
            order.setOrderNumber("GC-20250101-0001");
            order.setUserId(USER_ID);
            order.setStatus(OrderStatus.PENDING);
            order.setSubtotal(BigDecimal.valueOf(3000));
            order.setGrandTotal(BigDecimal.valueOf(3000));
            order.setItems(new ArrayList<>());
            order.setStatusHistory(new ArrayList<>());

            OrderStatusUpdateRequest request = OrderStatusUpdateRequest.builder()
                    .status(OrderStatus.CONFIRMED)
                    .notes("Order confirmed by admin")
                    .build();

            when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
            when(orderRepository.save(any(Order.class))).thenReturn(order);

            OrderResponse result = orderService.updateStatus(1L, request);

            assertThat(result).isNotNull();
            assertThat(result.getStatus()).isEqualTo(OrderStatus.CONFIRMED);
            verify(orderStatusHistoryRepository).save(any(OrderStatusHistory.class));
        }

        @Test
        @DisplayName("should throw BusinessException for invalid transition PENDING -> DISPATCHED")
        void updateStatus_invalidTransition_shouldThrowBusinessException() {
            Order order = new Order();
            order.setId(1L);
            order.setOrderNumber("GC-20250101-0001");
            order.setUserId(USER_ID);
            order.setStatus(OrderStatus.PENDING);
            order.setItems(new ArrayList<>());
            order.setStatusHistory(new ArrayList<>());

            OrderStatusUpdateRequest request = OrderStatusUpdateRequest.builder()
                    .status(OrderStatus.DISPATCHED)
                    .build();

            when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

            assertThatThrownBy(() -> orderService.updateStatus(1L, request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Invalid status transition")
                    .extracting("errorCode")
                    .isEqualTo("INVALID_STATUS_TRANSITION");

            verify(orderRepository, never()).save(any(Order.class));
        }

        @Test
        @DisplayName("should throw BusinessException for transition from terminal DELIVERED status")
        void updateStatus_fromDeliveredStatus_shouldThrowBusinessException() {
            Order order = new Order();
            order.setId(1L);
            order.setOrderNumber("GC-20250101-0001");
            order.setUserId(USER_ID);
            order.setStatus(OrderStatus.DELIVERED);
            order.setItems(new ArrayList<>());
            order.setStatusHistory(new ArrayList<>());

            OrderStatusUpdateRequest request = OrderStatusUpdateRequest.builder()
                    .status(OrderStatus.CONFIRMED)
                    .build();

            when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

            assertThatThrownBy(() -> orderService.updateStatus(1L, request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Invalid status transition")
                    .extracting("errorCode")
                    .isEqualTo("INVALID_STATUS_TRANSITION");
        }
    }

    @Nested
    @DisplayName("Cancel Order")
    class CancelOrderTests {

        @Test
        @DisplayName("should cancel order from PENDING status and restore stock")
        void cancelOrder_fromPending_shouldCancelAndRestoreStock() {
            Product product = new Product();
            product.setId(10L);
            product.setName("Velvet Curtain");
            product.setStockQuantity(48);

            OrderItem orderItem = new OrderItem();
            orderItem.setProductId(10L);
            orderItem.setVariantId(null);
            orderItem.setQuantity(2);

            Order order = new Order();
            order.setId(1L);
            order.setOrderNumber("GC-20250101-0001");
            order.setUserId(USER_ID);
            order.setStatus(OrderStatus.PENDING);
            order.setSubtotal(BigDecimal.valueOf(3000));
            order.setGrandTotal(BigDecimal.valueOf(3000));
            order.setItems(new ArrayList<>(List.of(orderItem)));
            order.setStatusHistory(new ArrayList<>());

            when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
            when(productRepository.findById(10L)).thenReturn(Optional.of(product));
            when(orderRepository.save(any(Order.class))).thenReturn(order);

            OrderResponse result = orderService.cancelOrder(1L);

            assertThat(result).isNotNull();
            assertThat(result.getStatus()).isEqualTo(OrderStatus.CANCELLED);
            assertThat(product.getStockQuantity()).isEqualTo(50); // 48 + 2 restored
            verify(orderStatusHistoryRepository).save(any(OrderStatusHistory.class));
            verify(productRepository).save(product);
        }

        @Test
        @DisplayName("should cancel order from CONFIRMED status")
        void cancelOrder_fromConfirmed_shouldCancelSuccessfully() {
            Order order = new Order();
            order.setId(2L);
            order.setOrderNumber("GC-20250101-0002");
            order.setUserId(USER_ID);
            order.setStatus(OrderStatus.CONFIRMED);
            order.setSubtotal(BigDecimal.valueOf(1000));
            order.setGrandTotal(BigDecimal.valueOf(1000));
            order.setItems(new ArrayList<>());
            order.setStatusHistory(new ArrayList<>());

            when(orderRepository.findById(2L)).thenReturn(Optional.of(order));
            when(orderRepository.save(any(Order.class))).thenReturn(order);

            OrderResponse result = orderService.cancelOrder(2L);

            assertThat(result).isNotNull();
            assertThat(result.getStatus()).isEqualTo(OrderStatus.CANCELLED);
        }

        @Test
        @DisplayName("should throw BusinessException when cancelling DISPATCHED order")
        void cancelOrder_fromDispatched_shouldThrowBusinessException() {
            Order order = new Order();
            order.setId(3L);
            order.setOrderNumber("GC-20250101-0003");
            order.setUserId(USER_ID);
            order.setStatus(OrderStatus.DISPATCHED);
            order.setItems(new ArrayList<>());
            order.setStatusHistory(new ArrayList<>());

            when(orderRepository.findById(3L)).thenReturn(Optional.of(order));

            assertThatThrownBy(() -> orderService.cancelOrder(3L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Pending or Confirmed")
                    .extracting("errorCode")
                    .isEqualTo("CANCEL_NOT_ALLOWED");

            verify(orderRepository, never()).save(any(Order.class));
        }
    }

    @Nested
    @DisplayName("Get Order by ID")
    class GetOrderTests {

        @Test
        @DisplayName("should throw BusinessException when order not found")
        void getOrder_whenNotFound_shouldThrowBusinessException() {
            when(orderRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> orderService.getOrder(999L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Order not found")
                    .extracting("errorCode")
                    .isEqualTo("ORDER_NOT_FOUND");
        }

        @Test
        @DisplayName("should return order detail when order exists")
        void getOrder_whenExists_shouldReturnOrderDetail() {
            Order order = new Order();
            order.setId(1L);
            order.setOrderNumber("GC-20250101-0001");
            order.setUserId(USER_ID);
            order.setStatus(OrderStatus.CONFIRMED);
            order.setSubtotal(BigDecimal.valueOf(3000));
            order.setGrandTotal(BigDecimal.valueOf(3000));
            order.setItems(new ArrayList<>());
            order.setStatusHistory(new ArrayList<>());

            when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

            OrderDetailResponse result = orderService.getOrder(1L);

            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo(1L);
            assertThat(result.getOrderNumber()).isEqualTo("GC-20250101-0001");
            assertThat(result.getStatus()).isEqualTo(OrderStatus.CONFIRMED);
            assertThat(result.getUserId()).isEqualTo(USER_ID);
        }
    }
}
