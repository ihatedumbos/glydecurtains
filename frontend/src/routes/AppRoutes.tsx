import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '@/routes/ProtectedRoute';
import AdminRoute from '@/routes/AdminRoute';
import PageTransition from '@/components/common/PageTransition';
import { PageSkeleton } from '@/components/common/SkeletonLoader';
import AdminLayout from '@/components/layout/AdminLayout';

// ---------- Public pages (lazy) ----------
const HomePage = lazy(() => import('@/pages/public/HomePage'));
const ProductListPage = lazy(() => import('@/pages/public/ProductListPage'));
const ProductDetailPage = lazy(() => import('@/pages/public/ProductDetailPage'));
const CategoryPage = lazy(() => import('@/pages/public/CategoryPage'));
const SearchResultsPage = lazy(() => import('@/pages/public/SearchResultsPage'));
const StoreLocatorPage = lazy(() => import('@/pages/public/StoreLocatorPage'));
const AboutPage = lazy(() => import('@/pages/public/AboutPage'));
const AchievementsPage = lazy(() => import('@/pages/public/AchievementsPage'));
const ContactPage = lazy(() => import('@/pages/public/ContactPage'));
const StaticPage = lazy(() => import('@/pages/public/StaticPage'));

// ---------- Auth pages (lazy) ----------
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'));

// ---------- Customer pages (lazy) ----------
const CartPage = lazy(() => import('@/pages/customer/CartPage'));
const CheckoutPage = lazy(() => import('@/pages/customer/CheckoutPage'));
const WishlistPage = lazy(() => import('@/pages/customer/WishlistPage'));
const OrdersPage = lazy(() => import('@/pages/customer/OrdersPage'));
const OrderDetailPage = lazy(() => import('@/pages/customer/OrderDetailPage'));
const ProfilePage = lazy(() => import('@/pages/customer/ProfilePage'));
const ChangePasswordPage = lazy(() => import('@/pages/customer/ChangePasswordPage'));
const FeedbackPage = lazy(() => import('@/pages/customer/FeedbackPage'));

// ---------- Admin pages (lazy) ----------
const DashboardPage = lazy(() => import('@/pages/admin/DashboardPage'));
const ProductManagementPage = lazy(() => import('@/pages/admin/ProductManagementPage'));
const CategoryManagementPage = lazy(() => import('@/pages/admin/CategoryManagementPage'));
const OrderManagementPage = lazy(() => import('@/pages/admin/OrderManagementPage'));
const UserManagementPage = lazy(() => import('@/pages/admin/UserManagementPage'));
const EmployeeManagementPage = lazy(() => import('@/pages/admin/EmployeeManagementPage'));
const PermissionManagementPage = lazy(() => import('@/pages/admin/PermissionManagementPage'));
const CmsManagementPage = lazy(() => import('@/pages/admin/CmsManagementPage'));
const SiteSettingsPage = lazy(() => import('@/pages/admin/SiteSettingsPage'));
const ThemeManagementPage = lazy(() => import('@/pages/admin/ThemeManagementPage'));
const StoreManagementPage = lazy(() => import('@/pages/admin/StoreManagementPage'));
const FeedbackManagementPage = lazy(() => import('@/pages/admin/FeedbackManagementPage'));
const AchievementManagementPage = lazy(() => import('@/pages/admin/AchievementManagementPage'));
const EnquiryManagementPage = lazy(() => import('@/pages/admin/EnquiryManagementPage'));
const InvoiceManagementPage = lazy(() => import('@/pages/admin/InvoiceManagementPage'));
const ActivityLogPage = lazy(() => import('@/pages/admin/ActivityLogPage'));
const InventoryManagementPage = lazy(() => import('@/pages/admin/InventoryManagementPage'));
const ReportsPage = lazy(() => import('@/pages/admin/ReportsPage'));

// ---------- Error pages (lazy) ----------
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const ForbiddenPage = lazy(() => import('@/pages/ForbiddenPage'));

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PageTransition>
        <Routes>
        {/* ===== Public routes ===== */}
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductListPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/categories/:slug" element={<CategoryPage />} />
        <Route path="/search" element={<SearchResultsPage />} />
        <Route path="/stores" element={<StoreLocatorPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/achievements" element={<AchievementsPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/pages/:slug" element={<StaticPage />} />

        {/* ===== Auth routes ===== */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* ===== Protected customer routes ===== */}
        <Route element={<ProtectedRoute />}>
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/change-password" element={<ChangePasswordPage />} />
          <Route path="/feedback" element={<FeedbackPage />} />
        </Route>

        {/* ===== Admin/Employee routes ===== */}
        <Route element={<AdminRoute />}>
         <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<DashboardPage />} />
          <Route path="/admin/products" element={<ProductManagementPage />} />
          <Route path="/admin/categories" element={<CategoryManagementPage />} />
          <Route path="/admin/orders" element={<OrderManagementPage />} />
          <Route path="/admin/users" element={<UserManagementPage />} />
          <Route path="/admin/employees" element={<EmployeeManagementPage />} />
          <Route path="/admin/permissions" element={<PermissionManagementPage />} />
          <Route path="/admin/cms" element={<CmsManagementPage />} />
          <Route path="/admin/site-settings" element={<SiteSettingsPage />} />
          <Route path="/admin/themes" element={<ThemeManagementPage />} />
          <Route path="/admin/stores" element={<StoreManagementPage />} />
          <Route path="/admin/feedback" element={<FeedbackManagementPage />} />
          <Route path="/admin/achievements" element={<AchievementManagementPage />} />
          <Route path="/admin/enquiries" element={<EnquiryManagementPage />} />
          <Route path="/admin/invoices" element={<InvoiceManagementPage />} />
          <Route path="/admin/activity-logs" element={<ActivityLogPage />} />
          <Route path="/admin/inventory" element={<InventoryManagementPage />} />
          <Route path="/admin/reports" element={<ReportsPage />} />
          </Route>
        </Route>

        {/* ===== Error routes ===== */}
        <Route path="/forbidden" element={<ForbiddenPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </PageTransition>
    </Suspense>
  );
}
