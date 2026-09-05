import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';

export default function AdminRoute() {
  const { isAuthenticated, user, loading } = useAppSelector((state) => state.auth);

  if (loading) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const allowedRoles = new Set(['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE']);
  if (!allowedRoles.has(user.role)) {
    return <Navigate to="/forbidden" replace />;
  }

  return <Outlet />;
}
