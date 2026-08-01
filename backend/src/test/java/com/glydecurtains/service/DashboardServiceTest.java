package com.glydecurtains.service;

import com.glydecurtains.dto.response.ActivityLogResponse;
import com.glydecurtains.dto.response.ChartDataResponse;
import com.glydecurtains.dto.response.DashboardSummaryResponse;
import com.glydecurtains.dto.response.ProductResponse;
import com.glydecurtains.entity.*;
import com.glydecurtains.entity.enums.*;
import com.glydecurtains.repository.*;
import com.glydecurtains.service.impl.DashboardServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private EnquiryRepository enquiryRepository;

    @Mock
    private ActivityLogRepository activityLogRepository;

    @InjectMocks
    private DashboardServiceImpl dashboardService;

    private Order deliveredOrder;
    private Order pendingOrder;
    private Product activeProduct;
    private Product lowStockProduct;
    private User customerUser;
    private User employeeUser;
    private User pendingUser;
    private ActivityLog activityLog;

    @BeforeEach
    void setUp() {
        deliveredOrder = new Order();
        deliveredOrder.setId(1L);
        deliveredOrder.setStatus(OrderStatus.DELIVERED);
        deliveredOrder.setGrandTotal(new BigDecimal("1500.00"));
        deliveredOrder.setCreatedAt(LocalDateTime.now().minusDays(2));

        pendingOrder = new Order();
        pendingOrder.setId(2L);
        pendingOrder.setStatus(OrderStatus.PENDING);
        pendingOrder.setGrandTotal(new BigDecimal("500.00"));
        pendingOrder.setCreatedAt(LocalDateTime.now().minusDays(1));

        activeProduct = new Product();
        activeProduct.setId(1L);
        activeProduct.setName("Premium Curtain");
        activeProduct.setSku("SKU-001");
        activeProduct.setStatus(ProductStatus.ACTIVE);
        activeProduct.setStockQuantity(50);
        activeProduct.setBasePrice(new BigDecimal("299.99"));
        activeProduct.setCategoryId(1L);
        activeProduct.setCreatedAt(LocalDateTime.now().minusDays(10));

        lowStockProduct = new Product();
        lowStockProduct.setId(2L);
        lowStockProduct.setName("Silk Drape");
        lowStockProduct.setSku("SKU-002");
        lowStockProduct.setStatus(ProductStatus.ACTIVE);
        lowStockProduct.setStockQuantity(3);
        lowStockProduct.setBasePrice(new BigDecimal("199.99"));
        lowStockProduct.setCategoryId(1L);
        lowStockProduct.setCreatedAt(LocalDateTime.now().minusDays(5));

        customerUser = new User();
        customerUser.setId(1L);
        customerUser.setName("John Doe");
        customerUser.setEmail("john@example.com");
        customerUser.setPassword("hashed");
        customerUser.setRole(UserRole.CUSTOMER);
        customerUser.setStatus(UserStatus.APPROVED);
        customerUser.setCreatedAt(LocalDateTime.now().minusDays(15));

        employeeUser = new User();
        employeeUser.setId(2L);
        employeeUser.setName("Jane Smith");
        employeeUser.setEmail("jane@example.com");
        employeeUser.setPassword("hashed");
        employeeUser.setRole(UserRole.EMPLOYEE);
        employeeUser.setStatus(UserStatus.APPROVED);
        employeeUser.setCreatedAt(LocalDateTime.now().minusDays(10));

        pendingUser = new User();
        pendingUser.setId(3L);
        pendingUser.setName("Bob Pending");
        pendingUser.setEmail("bob@example.com");
        pendingUser.setPassword("hashed");
        pendingUser.setRole(UserRole.CUSTOMER);
        pendingUser.setStatus(UserStatus.PENDING);
        pendingUser.setCreatedAt(LocalDateTime.now().minusDays(1));

        activityLog = ActivityLog.builder()
                .id(1L)
                .userId(1L)
                .actionType("LOGIN")
                .entityType("USER")
                .entityId(1L)
                .details("User logged in")
                .ipAddress("127.0.0.1")
                .timestamp(LocalDateTime.now().minusMinutes(5))
                .build();
    }

    @Nested
    @DisplayName("getSummary")
    class GetSummaryTests {

        @Test
        @DisplayName("should return correct summary stats with orders, products, users, employees, pending, low stock, revenue, and enquiries")
        void shouldReturnCorrectSummaryStats() {
            when(orderRepository.count()).thenReturn(2L);
            when(productRepository.count()).thenReturn(2L);
            when(userRepository.count()).thenReturn(3L);
            when(userRepository.findAll()).thenReturn(List.of(customerUser, employeeUser, pendingUser));
            when(orderRepository.findAll()).thenReturn(List.of(deliveredOrder, pendingOrder));
            when(productRepository.findAll()).thenReturn(List.of(activeProduct, lowStockProduct));
            when(enquiryRepository.count()).thenReturn(5L);

            DashboardSummaryResponse result = dashboardService.getSummary();

            assertThat(result.getTotalOrders()).isEqualTo(2L);
            assertThat(result.getTotalProducts()).isEqualTo(2L);
            assertThat(result.getTotalUsers()).isEqualTo(3L);
            assertThat(result.getTotalEmployees()).isEqualTo(1L);
            assertThat(result.getPendingApprovals()).isEqualTo(1L);
            assertThat(result.getLowStockCount()).isEqualTo(1L);
            assertThat(result.getTotalRevenue()).isEqualByComparingTo(new BigDecimal("1500.00"));
            assertThat(result.getTotalEnquiries()).isEqualTo(5L);
        }

        @Test
        @DisplayName("should return zero revenue when no delivered orders exist")
        void shouldReturnZeroRevenueWhenNoDeliveredOrders() {
            when(orderRepository.count()).thenReturn(1L);
            when(productRepository.count()).thenReturn(0L);
            when(userRepository.count()).thenReturn(1L);
            when(userRepository.findAll()).thenReturn(List.of(customerUser));
            when(orderRepository.findAll()).thenReturn(List.of(pendingOrder));
            when(productRepository.findAll()).thenReturn(Collections.emptyList());
            when(enquiryRepository.count()).thenReturn(0L);

            DashboardSummaryResponse result = dashboardService.getSummary();

            assertThat(result.getTotalRevenue()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(result.getLowStockCount()).isEqualTo(0L);
            assertThat(result.getTotalEmployees()).isEqualTo(0L);
            assertThat(result.getPendingApprovals()).isEqualTo(0L);
        }

        @Test
        @DisplayName("should handle empty data gracefully")
        void shouldHandleEmptyData() {
            when(orderRepository.count()).thenReturn(0L);
            when(productRepository.count()).thenReturn(0L);
            when(userRepository.count()).thenReturn(0L);
            when(userRepository.findAll()).thenReturn(Collections.emptyList());
            when(orderRepository.findAll()).thenReturn(Collections.emptyList());
            when(productRepository.findAll()).thenReturn(Collections.emptyList());
            when(enquiryRepository.count()).thenReturn(0L);

            DashboardSummaryResponse result = dashboardService.getSummary();

            assertThat(result.getTotalOrders()).isEqualTo(0L);
            assertThat(result.getTotalProducts()).isEqualTo(0L);
            assertThat(result.getTotalUsers()).isEqualTo(0L);
            assertThat(result.getTotalEmployees()).isEqualTo(0L);
            assertThat(result.getPendingApprovals()).isEqualTo(0L);
            assertThat(result.getLowStockCount()).isEqualTo(0L);
            assertThat(result.getTotalRevenue()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(result.getTotalEnquiries()).isEqualTo(0L);
        }
    }

    @Nested
    @DisplayName("getRecentActivity")
    class GetRecentActivityTests {

        @Test
        @DisplayName("should return recent activity logs with correct mapping")
        void shouldReturnRecentActivityLogs() {
            Page<ActivityLog> page = new PageImpl<>(List.of(activityLog));
            when(activityLogRepository.findAll(any(Pageable.class))).thenReturn(page);

            List<ActivityLogResponse> result = dashboardService.getRecentActivity(10);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getId()).isEqualTo(1L);
            assertThat(result.get(0).getUserId()).isEqualTo(1L);
            assertThat(result.get(0).getActionType()).isEqualTo("LOGIN");
            assertThat(result.get(0).getEntityType()).isEqualTo("USER");
            assertThat(result.get(0).getEntityId()).isEqualTo(1L);
            assertThat(result.get(0).getDetails()).isEqualTo("User logged in");
            assertThat(result.get(0).getIpAddress()).isEqualTo("127.0.0.1");
        }

        @Test
        @DisplayName("should default limit to 20 when limit is zero or negative")
        void shouldDefaultLimitWhenZeroOrNegative() {
            Page<ActivityLog> page = new PageImpl<>(Collections.emptyList());
            when(activityLogRepository.findAll(any(Pageable.class))).thenReturn(page);

            dashboardService.getRecentActivity(0);

            verify(activityLogRepository).findAll(argThat((Pageable p) -> p.getPageSize() == 20));
        }

        @Test
        @DisplayName("should return empty list when no activity logs exist")
        void shouldReturnEmptyListWhenNoLogs() {
            Page<ActivityLog> page = new PageImpl<>(Collections.emptyList());
            when(activityLogRepository.findAll(any(Pageable.class))).thenReturn(page);

            List<ActivityLogResponse> result = dashboardService.getRecentActivity(5);

            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("getOrderTrends (Chart Data)")
    class GetChartDataTests {

        @Test
        @DisplayName("should return chart data with 7d period")
        void shouldReturnChartDataFor7Days() {
            Order recentOrder = new Order();
            recentOrder.setId(3L);
            recentOrder.setStatus(OrderStatus.CONFIRMED);
            recentOrder.setGrandTotal(new BigDecimal("200.00"));
            recentOrder.setCreatedAt(LocalDateTime.now().minusDays(2));

            when(orderRepository.findAll()).thenReturn(List.of(recentOrder));

            ChartDataResponse result = dashboardService.getOrderTrends("7d");

            assertThat(result.getPeriod()).isEqualTo("7d");
            assertThat(result.getLabels()).isNotEmpty();
            assertThat(result.getDatasets()).hasSize(1);
            assertThat(result.getDatasets().get(0).getLabel()).isEqualTo("Orders");
            assertThat(result.getDatasets().get(0).getData()).isNotEmpty();
        }

        @Test
        @DisplayName("should return chart data with 30d period")
        void shouldReturnChartDataFor30Days() {
            when(orderRepository.findAll()).thenReturn(List.of(deliveredOrder, pendingOrder));

            ChartDataResponse result = dashboardService.getOrderTrends("30d");

            assertThat(result.getPeriod()).isEqualTo("30d");
            assertThat(result.getLabels()).isNotEmpty();
            assertThat(result.getDatasets()).hasSize(1);
            assertThat(result.getDatasets().get(0).getLabel()).isEqualTo("Orders");
        }

        @Test
        @DisplayName("should return revenue trends excluding cancelled orders")
        void shouldReturnRevenueTrendsExcludingCancelled() {
            Order cancelledOrder = new Order();
            cancelledOrder.setId(4L);
            cancelledOrder.setStatus(OrderStatus.CANCELLED);
            cancelledOrder.setGrandTotal(new BigDecimal("100.00"));
            cancelledOrder.setCreatedAt(LocalDateTime.now().minusDays(3));

            when(orderRepository.findAll()).thenReturn(List.of(deliveredOrder, cancelledOrder));

            ChartDataResponse result = dashboardService.getRevenueTrends("30d");

            assertThat(result.getPeriod()).isEqualTo("30d");
            assertThat(result.getDatasets()).hasSize(1);
            assertThat(result.getDatasets().get(0).getLabel()).isEqualTo("Revenue");
        }

        @Test
        @DisplayName("should return user trends for given period")
        void shouldReturnUserTrends() {
            when(userRepository.findAll()).thenReturn(List.of(customerUser, employeeUser, pendingUser));

            ChartDataResponse result = dashboardService.getUserTrends("30d");

            assertThat(result.getPeriod()).isEqualTo("30d");
            assertThat(result.getLabels()).isNotEmpty();
            assertThat(result.getDatasets()).hasSize(1);
            assertThat(result.getDatasets().get(0).getLabel()).isEqualTo("New Users");
        }

        @Test
        @DisplayName("should default to 30d when period is null")
        void shouldDefaultTo30dWhenPeriodIsNull() {
            when(orderRepository.findAll()).thenReturn(Collections.emptyList());

            ChartDataResponse result = dashboardService.getOrderTrends(null);

            assertThat(result.getLabels()).isNotEmpty();
            assertThat(result.getDatasets()).hasSize(1);
        }
    }

    @Nested
    @DisplayName("getLowStockProducts")
    class GetLowStockProductsTests {

        @Test
        @DisplayName("should return products below default threshold of 10")
        void shouldReturnProductsBelowDefaultThreshold() {
            when(productRepository.findAll()).thenReturn(List.of(activeProduct, lowStockProduct));

            List<ProductResponse> result = dashboardService.getLowStockProducts(0);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getName()).isEqualTo("Silk Drape");
            assertThat(result.get(0).getStockQuantity()).isEqualTo(3);
        }

        @Test
        @DisplayName("should return products below custom threshold")
        void shouldReturnProductsBelowCustomThreshold() {
            when(productRepository.findAll()).thenReturn(List.of(activeProduct, lowStockProduct));

            List<ProductResponse> result = dashboardService.getLowStockProducts(60);

            assertThat(result).hasSize(2);
            // Sorted by stock quantity ascending
            assertThat(result.get(0).getStockQuantity()).isEqualTo(3);
            assertThat(result.get(1).getStockQuantity()).isEqualTo(50);
        }

        @Test
        @DisplayName("should exclude non-active products")
        void shouldExcludeNonActiveProducts() {
            Product archivedProduct = new Product();
            archivedProduct.setId(3L);
            archivedProduct.setName("Archived Curtain");
            archivedProduct.setSku("SKU-003");
            archivedProduct.setStatus(ProductStatus.ARCHIVED);
            archivedProduct.setStockQuantity(2);
            archivedProduct.setBasePrice(new BigDecimal("99.99"));
            archivedProduct.setCategoryId(1L);

            when(productRepository.findAll()).thenReturn(List.of(lowStockProduct, archivedProduct));

            List<ProductResponse> result = dashboardService.getLowStockProducts(10);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getName()).isEqualTo("Silk Drape");
        }

        @Test
        @DisplayName("should return empty list when no products are below threshold")
        void shouldReturnEmptyWhenNoLowStock() {
            when(productRepository.findAll()).thenReturn(List.of(activeProduct));

            List<ProductResponse> result = dashboardService.getLowStockProducts(0);

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("should sort results by stock quantity ascending")
        void shouldSortByStockQuantityAscending() {
            Product veryLowStock = new Product();
            veryLowStock.setId(4L);
            veryLowStock.setName("Almost Out");
            veryLowStock.setSku("SKU-004");
            veryLowStock.setStatus(ProductStatus.ACTIVE);
            veryLowStock.setStockQuantity(1);
            veryLowStock.setBasePrice(new BigDecimal("149.99"));
            veryLowStock.setCategoryId(1L);

            when(productRepository.findAll()).thenReturn(List.of(lowStockProduct, veryLowStock));

            List<ProductResponse> result = dashboardService.getLowStockProducts(10);

            assertThat(result).hasSize(2);
            assertThat(result.get(0).getStockQuantity()).isEqualTo(1);
            assertThat(result.get(1).getStockQuantity()).isEqualTo(3);
        }
    }
}
