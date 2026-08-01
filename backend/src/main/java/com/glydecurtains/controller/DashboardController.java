package com.glydecurtains.controller;

import com.glydecurtains.dto.request.ReportFilterRequest;
import com.glydecurtains.dto.response.*;
import com.glydecurtains.security.RequiresPermission;
import com.glydecurtains.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/summary")
    @RequiresPermission(entity = "dashboard", operation = "READ")
    public ResponseEntity<ApiResponse<DashboardSummaryResponse>> getSummary() {
        DashboardSummaryResponse summary = dashboardService.getSummary();
        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    @GetMapping("/activity")
    @RequiresPermission(entity = "dashboard", operation = "READ")
    public ResponseEntity<ApiResponse<List<ActivityLogResponse>>> getRecentActivity(
            @RequestParam(defaultValue = "20") int limit) {
        List<ActivityLogResponse> activity = dashboardService.getRecentActivity(limit);
        return ResponseEntity.ok(ApiResponse.success(activity));
    }

    @GetMapping("/charts/orders")
    @RequiresPermission(entity = "dashboard", operation = "READ")
    public ResponseEntity<ApiResponse<ChartDataResponse>> getOrderTrends(
            @RequestParam(defaultValue = "30d") String period) {
        ChartDataResponse chartData = dashboardService.getOrderTrends(period);
        return ResponseEntity.ok(ApiResponse.success(chartData));
    }

    @GetMapping("/charts/revenue")
    @RequiresPermission(entity = "dashboard", operation = "READ")
    public ResponseEntity<ApiResponse<ChartDataResponse>> getRevenueTrends(
            @RequestParam(defaultValue = "30d") String period) {
        ChartDataResponse chartData = dashboardService.getRevenueTrends(period);
        return ResponseEntity.ok(ApiResponse.success(chartData));
    }

    @GetMapping("/charts/users")
    @RequiresPermission(entity = "dashboard", operation = "READ")
    public ResponseEntity<ApiResponse<ChartDataResponse>> getUserTrends(
            @RequestParam(defaultValue = "30d") String period) {
        ChartDataResponse chartData = dashboardService.getUserTrends(period);
        return ResponseEntity.ok(ApiResponse.success(chartData));
    }

    @GetMapping("/low-stock")
    @RequiresPermission(entity = "dashboard", operation = "READ")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getLowStockProducts(
            @RequestParam(defaultValue = "10") int threshold) {
        List<ProductResponse> products = dashboardService.getLowStockProducts(threshold);
        return ResponseEntity.ok(ApiResponse.success(products));
    }

    @GetMapping("/reports/sales")
    @RequiresPermission(entity = "reports", operation = "READ")
    public ResponseEntity<ApiResponse<ReportResponse>> getSalesReport(ReportFilterRequest filter) {
        ReportResponse report = dashboardService.getSalesReport(filter);
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @GetMapping("/reports/users")
    @RequiresPermission(entity = "reports", operation = "READ")
    public ResponseEntity<ApiResponse<ReportResponse>> getUserActivityReport(ReportFilterRequest filter) {
        ReportResponse report = dashboardService.getUserActivityReport(filter);
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @GetMapping("/reports/inventory")
    @RequiresPermission(entity = "reports", operation = "READ")
    public ResponseEntity<ApiResponse<ReportResponse>> getInventoryReport() {
        ReportResponse report = dashboardService.getInventoryReport();
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @GetMapping("/reports/profit-loss")
    @RequiresPermission(entity = "reports", operation = "READ")
    public ResponseEntity<ApiResponse<ReportResponse>> getProfitLossReport(ReportFilterRequest filter) {
        ReportResponse report = dashboardService.getProfitLossReport(filter);
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @GetMapping("/reports/enquiries")
    @RequiresPermission(entity = "reports", operation = "READ")
    public ResponseEntity<ApiResponse<ReportResponse>> getEnquiryReport(ReportFilterRequest filter) {
        ReportResponse report = dashboardService.getEnquiryReport(filter);
        return ResponseEntity.ok(ApiResponse.success(report));
    }
}
