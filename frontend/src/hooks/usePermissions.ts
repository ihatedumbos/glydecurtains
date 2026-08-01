import { useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setMyPermissions, setPermissionLoading, setPermissionError } from '@/store/slices/permissionSlice';
import type { PermissionEntry } from '@/store/slices/permissionSlice';
import axiosInstance from '@/api/axiosInstance';

type Operation = 'create' | 'read' | 'update' | 'delete';

/**
 * Fetches and caches the current user's permissions from GET /api/permissions/me.
 * Provides helper functions to check permissions on entities.
 */
export function usePermissions() {
  const dispatch = useAppDispatch();
  const { myPermissions, loading, error } = useAppSelector((state) => state.permissions);
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const fetchPermissions = useCallback(async () => {
    if (!isAuthenticated) return;

    dispatch(setPermissionLoading(true));
    dispatch(setPermissionError(null));

    try {
      const response = await axiosInstance.get('/permissions/me');
      const permissions: PermissionEntry[] = response.data.data ?? response.data;
      dispatch(setMyPermissions(permissions));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch permissions';
      dispatch(setPermissionError(message));
    } finally {
      dispatch(setPermissionLoading(false));
    }
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    // Only fetch if authenticated and permissions not yet loaded
    if (isAuthenticated && myPermissions.length === 0 && !loading) {
      fetchPermissions();
    }
  }, [isAuthenticated, myPermissions.length, loading, fetchPermissions]);

  /**
   * Check if the current user has a specific permission on an entity.
   * Super Admin always returns true.
   */
  const hasPermission = useCallback(
    (entity: string, operation: Operation): boolean => {
      if (isSuperAdmin) return true;

      const entry = myPermissions.find(
        (p) => p.entity.toLowerCase() === entity.toLowerCase(),
      );
      if (!entry) return false;
      return entry[operation] === true;
    },
    [myPermissions, isSuperAdmin],
  );

  /**
   * Check if the user can read a given entity.
   */
  const canRead = useCallback(
    (entity: string) => hasPermission(entity, 'read'),
    [hasPermission],
  );

  /**
   * Check if the user can create on a given entity.
   */
  const canCreate = useCallback(
    (entity: string) => hasPermission(entity, 'create'),
    [hasPermission],
  );

  /**
   * Check if the user can update a given entity.
   */
  const canUpdate = useCallback(
    (entity: string) => hasPermission(entity, 'update'),
    [hasPermission],
  );

  /**
   * Check if the user can delete a given entity.
   */
  const canDelete = useCallback(
    (entity: string) => hasPermission(entity, 'delete'),
    [hasPermission],
  );

  return {
    permissions: myPermissions,
    loading,
    error,
    hasPermission,
    canRead,
    canCreate,
    canUpdate,
    canDelete,
    isSuperAdmin,
    refetch: fetchPermissions,
  };
}

export default usePermissions;
