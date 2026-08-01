package com.glydecurtains.service;

import com.glydecurtains.dto.request.ReportFilterRequest;
import com.glydecurtains.dto.response.*;

import java.util.List;

public interface DashboardService {

    DashboardSummaryResponse getSummary();

    List<ActivityLogResponse> getRecentActivity(int limit);

    ChartDataResponse getOrderTrends(String period);

    ChartDataResponse getRevenueTrends(String period);

    ChartDataResponse getUserTrends(String period);

    List<ProductResponse> getLowStockProducts(int threshold);

    ReportResponse getSalesReport(ReportFilterRequest filter);

    ReportResponse getUserActivityReport(ReportFilterRequest filter);

    ReportResponse getInventoryReport();

    ReportResponse getProfitLossReport(ReportFilterRequest filter);

    ReportResponse getEnquiryReport(ReportFilterRequest filter);
}
