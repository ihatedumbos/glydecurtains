import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import usePermissions from '@/hooks/usePermissions';

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE'] as const;

/**
 * Map from route path segments to permission entity names.
 * Used to enforce entity-level "read" permission on admin pages.
 */
const ROUTE_PERMISSION_MAP: Record<string, string> = {
  '/admin': 'dashboard',
  '/admin/products': 'products',
  '/admin/categories': 'categories',
  '/admin/orders': 'orders',
  '/admin/users': 'users',
  '/admin/employees': 'employees',
  '/admin/stores': 'stores',
  '/admin/feedback': 'feedback',
  '/admin/achievements': 'achievements',
  '/admin/enquiries': 'enquiries',
  '/admin/invoices': 'invoices',
  '/admin/reports': 'reports',
  '/admin/cms': 'cms',
  '/admin/themes': 'themes',
  '/admin/permissions': 'permissions',
  '/admin/activity-logs': 'activity-logs',
  '/admin/settings': 'settings',
};

/**
 * Route guard for admin/employee panel access.
 * - Redirects unauthenticated users to login.
 * - Redirects authenticated users without admin/employee role to 403 Forbidden.
 * - Checks entity-level "read" permission for the current route.
 */
export default function AdminRoute() {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const location = useLocation();
  const { hasPermission, loading } = usePermissions();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!user || !ADMIN_ROLES.includes(user.role as (typeof ADMIN_ROLES)[number])) {
    return <Navigate to="/forbidden" replace />;
  }

  // Don't block rendering while permissions are loading
  if (loading) {
    return <Outlet />;
  }

  // Check route-level permission
  const matchedEntity = getRouteEntity(location.pathname);
  if (matchedEntity && !hasPermission(matchedEntity, 'read')) {
    return <Navigate to="/forbidden" replace />;
  }

  return <Outlet />;
}

/**
 * Resolves the permission entity for a given pathname.
 * Matches the longest prefix in the route permission map.
 */
function getRouteEntity(pathname: string): string | null {
  // Try exact match first
  if (ROUTE_PERMISSION_MAP[pathname]) {
    return ROUTE_PERMISSION_MAP[pathname];
  }

  // Try prefix match (for nested routes like /admin/products/123)
  const sortedKeys = Object.keys(ROUTE_PERMISSION_MAP).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (key !== '/admin' && pathname.startsWith(key)) {
      return ROUTE_PERMISSION_MAP[key];
    }
  }

  // For the exact /admin path, require dashboard permission
  if (pathname === '/admin') {
    return ROUTE_PERMISSION_MAP['/admin'];
  }

  return null;
}
