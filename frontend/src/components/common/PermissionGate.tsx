import type { ReactNode } from 'react';
import usePermissions from '@/hooks/usePermissions';

type Operation = 'create' | 'read' | 'update' | 'delete';

interface PermissionGateProps {
  /** The entity name to check permissions on (e.g. "dashboard", "products") */
  entity: string;
  /** The operation to check (defaults to "read") */
  operation?: Operation;
  /** Content to render when permission is granted */
  children: ReactNode;
  /** Optional fallback content when permission is denied */
  fallback?: ReactNode;
}

/**
 * Conditionally renders children based on user permissions.
 * If the user has the required permission on the entity, children are rendered.
 * Otherwise, the fallback (or nothing) is rendered.
 */
export default function PermissionGate({
  entity,
  operation = 'read',
  children,
  fallback = null,
}: PermissionGateProps) {
  const { hasPermission, loading } = usePermissions();

  // While loading permissions, don't render anything to avoid flash
  if (loading) return null;

  if (hasPermission(entity, operation)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
