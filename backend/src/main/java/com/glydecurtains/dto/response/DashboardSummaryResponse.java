package com.glydecurtains.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardSummaryResponse {

    private long totalOrders;
    private long totalProducts;
    private long totalUsers;
    private long totalEmployees;
    private long pendingApprovals;
    private long lowStockCount;
    private BigDecimal totalRevenue;
    private long totalEnquiries;
}
