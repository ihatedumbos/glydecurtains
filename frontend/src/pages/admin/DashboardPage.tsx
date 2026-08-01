import { useEffect, useCallback, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setSummary,
  setRecentActivity,
  setOrderTrends,
  setRevenueTrends,
  setUserTrends,
  setDashboardLoading,
} from '@/store/slices/dashboardSlice';
import type { ChartDataPoint } from '@/store/slices/dashboardSlice';
import axiosInstance from '@/api/axiosInstance';
import SummaryCard from '@/components/admin/dashboard/SummaryCard';
import TrendChart from '@/components/admin/dashboard/TrendChart';
import ActivityFeed from '@/components/admin/dashboard/ActivityFeed';
import LowStockAlerts from '@/components/admin/dashboard/LowStockAlerts';

interface LowStockProduct {
  id: number;
  name: string;
  sku: string;
  stockQuantity: number;
  thumbnailUrl?: string | null;
}

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const { summary, recentActivity, orderTrends, revenueTrends, userTrends, loading } =
    useAppSelector((state) => state.dashboard);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [lowStockLoading, setLowStockLoading] = useState(false);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/dashboard/summary');
      const data = res.data.data;
      dispatch(setSummary({
        totalOrders: data.totalOrders,
        totalProducts: data.totalProducts,
        totalUsers: data.totalUsers,
        totalEmployees: data.totalEmployees,
        pendingApprovals: data.pendingApprovals,
        lowStockCount: data.lowStockCount,
        revenue: data.totalRevenue ?? data.revenue ?? 0,
        totalEnquiries: data.totalEnquiries,
      }));
    } catch {
      // handled by axios interceptor
    }
  }, [dispatch]);

  const fetchActivity = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/dashboard/activity', { params: { limit: 20 } });
      dispatch(setRecentActivity(res.data.data));
    } catch {
      // handled by axios interceptor
    }
  }, [dispatch]);

  const fetchChartData = useCallback(
    async (endpoint: string, setter: (data: ChartDataPoint[]) => void, period = '30d') => {
      try {
        const res = await axiosInstance.get(endpoint, { params: { period } });
        const chartData = res.data.data;
        // Transform to ChartDataPoint[] from backend response
        const points: ChartDataPoint[] =
          chartData.labels?.map((label: string, index: number) => ({
            label,
            value: chartData.datasets?.[0]?.data?.[index] ?? 0,
          })) ?? [];
        setter(points);
      } catch {
        // handled by axios interceptor
      }
    },
    [],
  );

  const fetchLowStock = useCallback(async () => {
    setLowStockLoading(true);
    try {
      const res = await axiosInstance.get('/dashboard/low-stock', { params: { threshold: 10 } });
      setLowStockProducts(res.data.data ?? []);
    } catch {
      // handled by axios interceptor
    } finally {
      setLowStockLoading(false);
    }
  }, []);

  useEffect(() => {
    dispatch(setDashboardLoading(true));
    Promise.all([
      fetchSummary(),
      fetchActivity(),
      fetchChartData('/dashboard/charts/orders', (data) => dispatch(setOrderTrends(data))),
      fetchChartData('/dashboard/charts/revenue', (data) => dispatch(setRevenueTrends(data))),
      fetchChartData('/dashboard/charts/users', (data) => dispatch(setUserTrends(data))),
      fetchLowStock(),
    ]).finally(() => {
      dispatch(setDashboardLoading(false));
    });
  }, [dispatch, fetchSummary, fetchActivity, fetchChartData, fetchLowStock]);

  const handleOrderPeriodChange = (period: string) => {
    fetchChartData('/dashboard/charts/orders', (data) => dispatch(setOrderTrends(data)), period);
  };

  const handleRevenuePeriodChange = (period: string) => {
    fetchChartData('/dashboard/charts/revenue', (data) => dispatch(setRevenueTrends(data)), period);
  };

  const handleUserPeriodChange = (period: string) => {
    fetchChartData('/dashboard/charts/users', (data) => dispatch(setUserTrends(data)), period);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Overview of your store performance and activity
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Orders"
          value={summary?.totalOrders ?? '—'}
          icon={<span>🛒</span>}
          color="#6366f1"
        />
        <SummaryCard
          title="Total Products"
          value={summary?.totalProducts ?? '—'}
          icon={<span>📦</span>}
          color="#8b5cf6"
        />
        <SummaryCard
          title="Total Users"
          value={summary?.totalUsers ?? '—'}
          icon={<span>👥</span>}
          color="#06b6d4"
        />
        <SummaryCard
          title="Total Employees"
          value={summary?.totalEmployees ?? '—'}
          icon={<span>🏢</span>}
          color="#0891b2"
        />
        <SummaryCard
          title="Pending Approvals"
          value={summary?.pendingApprovals ?? '—'}
          icon={<span>⏳</span>}
          color="#f59e0b"
        />
        <SummaryCard
          title="Low Stock Items"
          value={summary?.lowStockCount ?? '—'}
          icon={<span>⚠️</span>}
          color="#ef4444"
        />
        <SummaryCard
          title="Revenue"
          value={summary ? formatCurrency(summary.revenue) : '—'}
          icon={<span>💰</span>}
          color="#10b981"
        />
        <SummaryCard
          title="Enquiries"
          value={summary?.totalEnquiries ?? '—'}
          icon={<span>📩</span>}
          color="#ec4899"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <TrendChart
          title="Order Trends"
          labels={orderTrends.map((p) => p.label)}
          data={orderTrends.map((p) => p.value)}
          color="#6366f1"
          chartType="bar"
          onPeriodChange={handleOrderPeriodChange}
          loading={loading}
        />
        <TrendChart
          title="Revenue Trends"
          labels={revenueTrends.map((p) => p.label)}
          data={revenueTrends.map((p) => p.value)}
          color="#10b981"
          chartType="line"
          onPeriodChange={handleRevenuePeriodChange}
          loading={loading}
        />
        <TrendChart
          title="User Trends"
          labels={userTrends.map((p) => p.label)}
          data={userTrends.map((p) => p.value)}
          color="#8b5cf6"
          chartType="bar"
          onPeriodChange={handleUserPeriodChange}
          loading={loading}
        />
      </div>

      {/* Activity Feed + Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">
            Recent Activity
          </h3>
          <ActivityFeed activities={recentActivity as any[]} loading={loading} />
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">
            Low Stock Alerts
          </h3>
          <LowStockAlerts products={lowStockProducts} loading={lowStockLoading} />
        </div>
      </div>
    </div>
  );
}
