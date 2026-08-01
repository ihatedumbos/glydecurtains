package com.glydecurtains.service.impl;

import com.glydecurtains.dto.request.ReportFilterRequest;
import com.glydecurtains.dto.response.*;
import com.glydecurtains.entity.*;
import com.glydecurtains.entity.enums.*;
import com.glydecurtains.repository.*;
import com.glydecurtains.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardServiceImpl implements DashboardService {

    private static final int DEFAULT_LOW_STOCK_THRESHOLD = 10;

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final EnquiryRepository enquiryRepository;
    private final ActivityLogRepository activityLogRepository;

    @Override
    public DashboardSummaryResponse getSummary() {
        long totalOrders = orderRepository.count();
        long totalProducts = productRepository.count();
        long totalUsers = userRepository.count();

        long totalEmployees = userRepository.findAll().stream()
                .filter(u -> u.getRole() == UserRole.EMPLOYEE)
                .count();

        long pendingApprovals = userRepository.findAll().stream()
                .filter(u -> u.getStatus() == UserStatus.PENDING)
                .count();

        long lowStockCount = productRepository.findAll().stream()
                .filter(p -> p.getStatus() == ProductStatus.ACTIVE)
                .filter(p -> p.getStockQuantity() != null && p.getStockQuantity() < DEFAULT_LOW_STOCK_THRESHOLD)
                .count();

        BigDecimal totalRevenue = orderRepository.findAll().stream()
                .filter(o -> o.getStatus() == OrderStatus.DELIVERED)
                .map(Order::getGrandTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long totalEnquiries = enquiryRepository.count();

        return DashboardSummaryResponse.builder()
                .totalOrders(totalOrders)
                .totalProducts(totalProducts)
                .totalUsers(totalUsers)
                .totalEmployees(totalEmployees)
                .pendingApprovals(pendingApprovals)
                .lowStockCount(lowStockCount)
                .totalRevenue(totalRevenue)
                .totalEnquiries(totalEnquiries)
                .build();
    }

    @Override
    public List<ActivityLogResponse> getRecentActivity(int limit) {
        if (limit <= 0) {
            limit = 20;
        }
        List<ActivityLog> logs = activityLogRepository.findAll(
                PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "timestamp"))
        ).getContent();

        return logs.stream()
                .map(this::toActivityLogResponse)
                .collect(Collectors.toList());
    }

    @Override
    public ChartDataResponse getOrderTrends(String period) {
        LocalDateTime startDate = resolveStartDate(period);
        List<Order> orders = orderRepository.findAll().stream()
                .filter(o -> o.getCreatedAt().isAfter(startDate))
                .collect(Collectors.toList());

        Map<String, Long> groupedData = groupByDate(orders, period);
        List<String> labels = new ArrayList<>(groupedData.keySet());
        List<Number> data = new ArrayList<>(groupedData.values());

        return ChartDataResponse.builder()
                .period(period)
                .labels(labels)
                .datasets(List.of(
                        ChartDataResponse.ChartDatasetResponse.builder()
                                .label("Orders")
                                .data(data)
                                .build()
                ))
                .build();
    }

    @Override
    public ChartDataResponse getRevenueTrends(String period) {
        LocalDateTime startDate = resolveStartDate(period);
        List<Order> orders = orderRepository.findAll().stream()
                .filter(o -> o.getCreatedAt().isAfter(startDate))
                .filter(o -> o.getStatus() != OrderStatus.CANCELLED)
                .collect(Collectors.toList());

        Map<String, BigDecimal> revenueByDate = groupRevenueByDate(orders, period);
        List<String> labels = new ArrayList<>(revenueByDate.keySet());
        List<Number> data = new ArrayList<>(revenueByDate.values());

        return ChartDataResponse.builder()
                .period(period)
                .labels(labels)
                .datasets(List.of(
                        ChartDataResponse.ChartDatasetResponse.builder()
                                .label("Revenue")
                                .data(data)
                                .build()
                ))
                .build();
    }

    @Override
    public ChartDataResponse getUserTrends(String period) {
        LocalDateTime startDate = resolveStartDate(period);
        List<User> users = userRepository.findAll().stream()
                .filter(u -> u.getCreatedAt().isAfter(startDate))
                .collect(Collectors.toList());

        Map<String, Long> groupedData = groupUsersByDate(users, period);
        List<String> labels = new ArrayList<>(groupedData.keySet());
        List<Number> data = new ArrayList<>(groupedData.values());

        return ChartDataResponse.builder()
                .period(period)
                .labels(labels)
                .datasets(List.of(
                        ChartDataResponse.ChartDatasetResponse.builder()
                                .label("New Users")
                                .data(data)
                                .build()
                ))
                .build();
    }

    @Override
    public List<ProductResponse> getLowStockProducts(int threshold) {
        if (threshold <= 0) {
            threshold = DEFAULT_LOW_STOCK_THRESHOLD;
        }
        int finalThreshold = threshold;
        return productRepository.findAll().stream()
                .filter(p -> p.getStatus() == ProductStatus.ACTIVE)
                .filter(p -> p.getStockQuantity() != null && p.getStockQuantity() < finalThreshold)
                .sorted(Comparator.comparingInt(Product::getStockQuantity))
                .map(this::toProductResponse)
                .collect(Collectors.toList());
    }

    @Override
    public ReportResponse getSalesReport(ReportFilterRequest filter) {
        LocalDateTime startDate = resolveFilterStartDate(filter);
        LocalDateTime endDate = resolveFilterEndDate(filter);

        List<Order> orders = orderRepository.findAll().stream()
                .filter(o -> o.getCreatedAt().isAfter(startDate) && o.getCreatedAt().isBefore(endDate))
                .collect(Collectors.toList());

        long totalOrders = orders.size();
        long deliveredOrders = orders.stream().filter(o -> o.getStatus() == OrderStatus.DELIVERED).count();
        long cancelledOrders = orders.stream().filter(o -> o.getStatus() == OrderStatus.CANCELLED).count();
        BigDecimal totalRevenue = orders.stream()
                .filter(o -> o.getStatus() != OrderStatus.CANCELLED)
                .map(Order::getGrandTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalOrders", totalOrders);
        summary.put("deliveredOrders", deliveredOrders);
        summary.put("cancelledOrders", cancelledOrders);
        summary.put("totalRevenue", totalRevenue);
        summary.put("averageOrderValue", totalOrders > 0 ?
                totalRevenue.divide(BigDecimal.valueOf(totalOrders), 2, java.math.RoundingMode.HALF_UP) :
                BigDecimal.ZERO);

        // Status breakdown
        Map<OrderStatus, Long> statusBreakdown = orders.stream()
                .collect(Collectors.groupingBy(Order::getStatus, Collectors.counting()));

        List<Map<String, Object>> data = new ArrayList<>();
        statusBreakdown.forEach((status, count) -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("status", status.name());
            row.put("count", count);
            data.add(row);
        });

        return ReportResponse.builder()
                .reportType("sales")
                .title("Sales Report")
                .generatedAt(LocalDateTime.now())
                .summary(summary)
                .data(data)
                .exportFormat("JSON")
                .build();
    }

    @Override
    public ReportResponse getUserActivityReport(ReportFilterRequest filter) {
        LocalDateTime startDate = resolveFilterStartDate(filter);
        LocalDateTime endDate = resolveFilterEndDate(filter);

        List<User> users = userRepository.findAll();
        long totalUsers = users.size();
        long newUsersInPeriod = users.stream()
                .filter(u -> u.getCreatedAt().isAfter(startDate) && u.getCreatedAt().isBefore(endDate))
                .count();

        Map<UserRole, Long> roleBreakdown = users.stream()
                .collect(Collectors.groupingBy(User::getRole, Collectors.counting()));
        Map<UserStatus, Long> statusBreakdown = users.stream()
                .collect(Collectors.groupingBy(User::getStatus, Collectors.counting()));

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalUsers", totalUsers);
        summary.put("newUsersInPeriod", newUsersInPeriod);
        summary.put("roleBreakdown", roleBreakdown);
        summary.put("statusBreakdown", statusBreakdown);

        // Recent activity logs in period
        List<ActivityLog> activityLogs = activityLogRepository.findAll().stream()
                .filter(a -> a.getTimestamp().isAfter(startDate) && a.getTimestamp().isBefore(endDate))
                .sorted(Comparator.comparing(ActivityLog::getTimestamp).reversed())
                .limit(50)
                .collect(Collectors.toList());

        List<Map<String, Object>> data = activityLogs.stream().map(log -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("userId", log.getUserId());
            row.put("actionType", log.getActionType());
            row.put("entityType", log.getEntityType());
            row.put("timestamp", log.getTimestamp().toString());
            return row;
        }).collect(Collectors.toList());

        return ReportResponse.builder()
                .reportType("user_activity")
                .title("User Activity Report")
                .generatedAt(LocalDateTime.now())
                .summary(summary)
                .data(data)
                .exportFormat("JSON")
                .build();
    }

    @Override
    public ReportResponse getInventoryReport() {
        List<Product> products = productRepository.findAll();
        long totalProducts = products.size();
        long activeProducts = products.stream().filter(p -> p.getStatus() == ProductStatus.ACTIVE).count();
        long archivedProducts = products.stream().filter(p -> p.getStatus() == ProductStatus.ARCHIVED).count();
        long deactivatedProducts = products.stream().filter(p -> p.getStatus() == ProductStatus.DEACTIVATED).count();
        long lowStockProducts = products.stream()
                .filter(p -> p.getStatus() == ProductStatus.ACTIVE)
                .filter(p -> p.getStockQuantity() != null && p.getStockQuantity() < DEFAULT_LOW_STOCK_THRESHOLD)
                .count();
        long outOfStockProducts = products.stream()
                .filter(p -> p.getStatus() == ProductStatus.ACTIVE)
                .filter(p -> p.getStockQuantity() != null && p.getStockQuantity() == 0)
                .count();
        int totalStockUnits = products.stream()
                .filter(p -> p.getStockQuantity() != null)
                .mapToInt(Product::getStockQuantity)
                .sum();

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalProducts", totalProducts);
        summary.put("activeProducts", activeProducts);
        summary.put("archivedProducts", archivedProducts);
        summary.put("deactivatedProducts", deactivatedProducts);
        summary.put("lowStockProducts", lowStockProducts);
        summary.put("outOfStockProducts", outOfStockProducts);
        summary.put("totalStockUnits", totalStockUnits);

        // List low stock products as data
        List<Map<String, Object>> data = products.stream()
                .filter(p -> p.getStatus() == ProductStatus.ACTIVE)
                .filter(p -> p.getStockQuantity() != null && p.getStockQuantity() < DEFAULT_LOW_STOCK_THRESHOLD)
                .sorted(Comparator.comparingInt(Product::getStockQuantity))
                .map(p -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", p.getId());
                    row.put("name", p.getName());
                    row.put("sku", p.getSku());
                    row.put("stockQuantity", p.getStockQuantity());
                    row.put("basePrice", p.getBasePrice());
                    return row;
                })
                .collect(Collectors.toList());

        return ReportResponse.builder()
                .reportType("inventory")
                .title("Inventory Report")
                .generatedAt(LocalDateTime.now())
                .summary(summary)
                .data(data)
                .exportFormat("JSON")
                .build();
    }

    @Override
    public ReportResponse getProfitLossReport(ReportFilterRequest filter) {
        // Placeholder implementation - profit/loss calculation requires cost data not yet modeled
        LocalDateTime startDate = resolveFilterStartDate(filter);
        LocalDateTime endDate = resolveFilterEndDate(filter);

        List<Order> orders = orderRepository.findAll().stream()
                .filter(o -> o.getCreatedAt().isAfter(startDate) && o.getCreatedAt().isBefore(endDate))
                .filter(o -> o.getStatus() != OrderStatus.CANCELLED)
                .collect(Collectors.toList());

        BigDecimal totalRevenue = orders.stream()
                .map(Order::getGrandTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalRevenue", totalRevenue);
        summary.put("totalCost", BigDecimal.ZERO); // Placeholder - cost data not modeled
        summary.put("grossProfit", totalRevenue); // Placeholder
        summary.put("note", "Profit/Loss calculation is a placeholder. Cost data integration pending.");

        return ReportResponse.builder()
                .reportType("profit_loss")
                .title("Profit & Loss Report")
                .generatedAt(LocalDateTime.now())
                .summary(summary)
                .data(List.of())
                .exportFormat("JSON")
                .build();
    }

    @Override
    public ReportResponse getEnquiryReport(ReportFilterRequest filter) {
        LocalDateTime startDate = resolveFilterStartDate(filter);
        LocalDateTime endDate = resolveFilterEndDate(filter);

        List<Enquiry> enquiries = enquiryRepository.findAll().stream()
                .filter(e -> e.getCreatedAt().isAfter(startDate) && e.getCreatedAt().isBefore(endDate))
                .collect(Collectors.toList());

        long total = enquiries.size();
        Map<EnquiryStatus, Long> statusBreakdown = enquiries.stream()
                .collect(Collectors.groupingBy(Enquiry::getStatus, Collectors.counting()));

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalEnquiries", total);
        summary.put("statusBreakdown", statusBreakdown);

        List<Map<String, Object>> data = enquiries.stream()
                .sorted(Comparator.comparing(Enquiry::getCreatedAt).reversed())
                .limit(50)
                .map(e -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", e.getId());
                    row.put("name", e.getName());
                    row.put("email", e.getEmail());
                    row.put("subject", e.getSubject());
                    row.put("status", e.getStatus().name());
                    row.put("createdAt", e.getCreatedAt().toString());
                    return row;
                })
                .collect(Collectors.toList());

        return ReportResponse.builder()
                .reportType("enquiry")
                .title("Enquiry Report")
                .generatedAt(LocalDateTime.now())
                .summary(summary)
                .data(data)
                .exportFormat("JSON")
                .build();
    }

    // --- Helper methods ---

    private LocalDateTime resolveStartDate(String period) {
        LocalDateTime now = LocalDateTime.now();
        return switch (period != null ? period.toLowerCase() : "30d") {
            case "7d" -> now.minusDays(7);
            case "30d" -> now.minusDays(30);
            case "90d" -> now.minusDays(90);
            case "1y" -> now.minusYears(1);
            default -> now.minusDays(30);
        };
    }

    private LocalDateTime resolveFilterStartDate(ReportFilterRequest filter) {
        if (filter != null && filter.getStartDate() != null) {
            return filter.getStartDate().atStartOfDay();
        }
        return LocalDateTime.now().minusDays(30);
    }

    private LocalDateTime resolveFilterEndDate(ReportFilterRequest filter) {
        if (filter != null && filter.getEndDate() != null) {
            return filter.getEndDate().atTime(LocalTime.MAX);
        }
        return LocalDateTime.now();
    }

    private Map<String, Long> groupByDate(List<Order> orders, String period) {
        DateTimeFormatter formatter = getFormatterForPeriod(period);
        Map<String, Long> grouped = new LinkedHashMap<>();

        LocalDateTime start = resolveStartDate(period);
        LocalDateTime now = LocalDateTime.now();
        LocalDate current = start.toLocalDate();

        while (!current.isAfter(now.toLocalDate())) {
            String key = current.format(formatter);
            grouped.putIfAbsent(key, 0L);
            current = advanceDate(current, period);
        }

        orders.forEach(order -> {
            String key = order.getCreatedAt().format(formatter);
            grouped.merge(key, 1L, Long::sum);
        });

        return grouped;
    }

    private Map<String, BigDecimal> groupRevenueByDate(List<Order> orders, String period) {
        DateTimeFormatter formatter = getFormatterForPeriod(period);
        Map<String, BigDecimal> grouped = new LinkedHashMap<>();

        LocalDateTime start = resolveStartDate(period);
        LocalDateTime now = LocalDateTime.now();
        LocalDate current = start.toLocalDate();

        while (!current.isAfter(now.toLocalDate())) {
            String key = current.format(formatter);
            grouped.putIfAbsent(key, BigDecimal.ZERO);
            current = advanceDate(current, period);
        }

        orders.forEach(order -> {
            String key = order.getCreatedAt().format(formatter);
            grouped.merge(key, order.getGrandTotal(), BigDecimal::add);
        });

        return grouped;
    }

    private Map<String, Long> groupUsersByDate(List<User> users, String period) {
        DateTimeFormatter formatter = getFormatterForPeriod(period);
        Map<String, Long> grouped = new LinkedHashMap<>();

        LocalDateTime start = resolveStartDate(period);
        LocalDateTime now = LocalDateTime.now();
        LocalDate current = start.toLocalDate();

        while (!current.isAfter(now.toLocalDate())) {
            String key = current.format(formatter);
            grouped.putIfAbsent(key, 0L);
            current = advanceDate(current, period);
        }

        users.forEach(user -> {
            String key = user.getCreatedAt().format(formatter);
            grouped.merge(key, 1L, Long::sum);
        });

        return grouped;
    }

    private DateTimeFormatter getFormatterForPeriod(String period) {
        return switch (period != null ? period.toLowerCase() : "30d") {
            case "7d" -> DateTimeFormatter.ofPattern("yyyy-MM-dd");
            case "30d" -> DateTimeFormatter.ofPattern("yyyy-MM-dd");
            case "90d" -> DateTimeFormatter.ofPattern("yyyy-'W'ww");
            case "1y" -> DateTimeFormatter.ofPattern("yyyy-MM");
            default -> DateTimeFormatter.ofPattern("yyyy-MM-dd");
        };
    }

    private LocalDate advanceDate(LocalDate current, String period) {
        return switch (period != null ? period.toLowerCase() : "30d") {
            case "7d", "30d" -> current.plusDays(1);
            case "90d" -> current.plusWeeks(1);
            case "1y" -> current.plusMonths(1);
            default -> current.plusDays(1);
        };
    }

    private ActivityLogResponse toActivityLogResponse(ActivityLog log) {
        return ActivityLogResponse.builder()
                .id(log.getId())
                .userId(log.getUserId())
                .actionType(log.getActionType())
                .entityType(log.getEntityType())
                .entityId(log.getEntityId())
                .details(log.getDetails())
                .ipAddress(log.getIpAddress())
                .timestamp(log.getTimestamp())
                .build();
    }

    private ProductResponse toProductResponse(Product product) {
        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .sku(product.getSku())
                .barcode(product.getBarcode())
                .shortDescription(product.getShortDescription())
                .categoryId(product.getCategoryId())
                .stockQuantity(product.getStockQuantity())
                .basePrice(product.getBasePrice())
                .discountPercentage(product.getDiscountPercentage())
                .offerPrice(product.getOfferPrice())
                .status(product.getStatus())
                .isFeatured(product.getIsFeatured())
                .isTrending(product.getIsTrending())
                .isNewArrival(product.getIsNewArrival())
                .isBestSeller(product.getIsBestSeller())
                .isPremium(product.getIsPremium())
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }
}
