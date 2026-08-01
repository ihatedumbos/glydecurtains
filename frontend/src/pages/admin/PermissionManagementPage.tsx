import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  Tabs,
  Tab,
  Chip,
  CircularProgress,
  Alert,
  Autocomplete,
  TextField,
  Button,
  Tooltip,
  IconButton,
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import SaveIcon from '@mui/icons-material/Save';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import axiosInstance from '@/api/axiosInstance';

// ─── Types ──────────────────────────────────────────────────────────────────────

interface RolePermissionEntry {
  entity: string;
  operation: string;
  granted: boolean;
}

interface PermissionMatrixResponse {
  entities: string[];
  operations: string[];
  matrix: Record<string, RolePermissionEntry[]>;
}

interface ResolvedPermission {
  entity: string;
  operation: string;
  granted: boolean;
  source: 'ROLE' | 'USER_OVERRIDE' | 'IMPLICIT_DENY';
}

interface UserPermissionResponse {
  userId: number;
  userName: string;
  email: string;
  role: string;
  permissions: ResolvedPermission[];
}

interface UserSearchResult {
  id: number;
  name: string;
  email: string;
  role: string;
}

type PermissionUpdate = {
  entity: string;
  operation: string;
  granted: boolean;
};

// ─── Constants ──────────────────────────────────────────────────────────────────

const ROLES = ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE', 'CUSTOMER'] as const;

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  EMPLOYEE: 'Employee',
  CUSTOMER: 'Customer',
};

const OPERATION_LABELS: Record<string, string> = {
  CREATE: 'Create',
  READ: 'Read',
  UPDATE: 'Update',
  DELETE: 'Delete',
};

// ─── Helper ─────────────────────────────────────────────────────────────────────

function permissionKey(entity: string, operation: string) {
  return `${entity}:${operation}`;
}

function formatEntity(entity: string): string {
  return entity
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Component ──────────────────────────────────────────────────────────────────

export default function PermissionManagementPage() {
  // Matrix state
  const [matrix, setMatrix] = useState<PermissionMatrixResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Tab state: 0..3 = roles, 4 = user override
  const [activeTab, setActiveTab] = useState(0);

  // Pending changes per role
  const [pendingChanges, setPendingChanges] = useState<
    Record<string, Map<string, boolean>>
  >({});

  // User override state
  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState<UserSearchResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [userPermissions, setUserPermissions] = useState<ResolvedPermission[] | null>(null);
  const [userPendingChanges, setUserPendingChanges] = useState<Map<string, boolean>>(new Map());
  const [userLoading, setUserLoading] = useState(false);

  // ─── Fetch Matrix ───────────────────────────────────────────────────────────

  const fetchMatrix = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get<{ data: PermissionMatrixResponse }>(
        '/permissions/matrix'
      );
      setMatrix(response.data.data);
    } catch {
      setError('Failed to load permission matrix. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatrix();
  }, [fetchMatrix]);

  // ─── Current Role Permission Lookup ─────────────────────────────────────────

  const getGranted = useCallback(
    (role: string, entity: string, operation: string): boolean => {
      const key = permissionKey(entity, operation);
      // Check pending changes first
      const pending = pendingChanges[role];
      if (pending?.has(key)) {
        return pending.get(key)!;
      }
      // Fall back to matrix data
      const entries = matrix?.matrix[role];
      if (!entries) return false;
      const entry = entries.find((e) => e.entity === entity && e.operation === operation);
      return entry?.granted ?? false;
    },
    [matrix, pendingChanges]
  );

  // ─── Toggle Handler (Role Matrix) ──────────────────────────────────────────

  const handleRoleToggle = useCallback(
    (role: string, entity: string, operation: string) => {
      if (role === 'SUPER_ADMIN') return; // never editable
      const key = permissionKey(entity, operation);
      const current = getGranted(role, entity, operation);

      setPendingChanges((prev) => {
        const roleChanges = new Map(prev[role] || []);
        roleChanges.set(key, !current);
        return { ...prev, [role]: roleChanges };
      });
    },
    [getGranted]
  );

  // ─── Save Role Permissions ─────────────────────────────────────────────────

  const handleSaveRole = useCallback(
    async (role: string) => {
      const changes = pendingChanges[role];
      if (!changes || changes.size === 0) return;

      // Build the full permission list for this role (merge matrix + pending)
      const entries = matrix?.matrix[role] || [];
      const updates: PermissionUpdate[] = entries.map((entry) => {
        const key = permissionKey(entry.entity, entry.operation);
        return {
          entity: entry.entity,
          operation: entry.operation,
          granted: changes.has(key) ? changes.get(key)! : entry.granted,
        };
      });

      // Derive roleId from index (1-based mapping matches typical seeded data)
      const roleIndex = ROLES.indexOf(role as typeof ROLES[number]);
      const roleId = roleIndex + 1;

      try {
        setSaving(true);
        const response = await axiosInstance.put<{ data: PermissionMatrixResponse }>(
          `/permissions/roles/${roleId}`,
          updates
        );
        setMatrix(response.data.data);
        setPendingChanges((prev) => {
          const next = { ...prev };
          delete next[role];
          return next;
        });
      } catch {
        setError('Failed to save permissions. Please try again.');
      } finally {
        setSaving(false);
      }
    },
    [matrix, pendingChanges]
  );

  // ─── User Search ───────────────────────────────────────────────────────────

  const handleUserSearch = useCallback(async (query: string) => {
    setUserSearch(query);
    if (query.length < 2) {
      setUserResults([]);
      return;
    }
    try {
      const response = await axiosInstance.get<{ data: { content: UserSearchResult[] } }>(
        '/users',
        { params: { search: query, page: 0, size: 10 } }
      );
      setUserResults(response.data.data?.content || []);
    } catch {
      setUserResults([]);
    }
  }, []);

  // ─── Load User Permissions ─────────────────────────────────────────────────

  const handleUserSelect = useCallback(async (user: UserSearchResult | null) => {
    setSelectedUser(user);
    setUserPermissions(null);
    setUserPendingChanges(new Map());
    if (!user) return;

    try {
      setUserLoading(true);
      const response = await axiosInstance.get<{ data: UserPermissionResponse }>(
        `/permissions/users/${user.id}`
      );
      setUserPermissions(response.data.data.permissions);
    } catch {
      setError('Failed to load user permissions.');
    } finally {
      setUserLoading(false);
    }
  }, []);

  // ─── User Permission Toggle ────────────────────────────────────────────────

  const getUserGranted = useCallback(
    (entity: string, operation: string): boolean => {
      const key = permissionKey(entity, operation);
      if (userPendingChanges.has(key)) {
        return userPendingChanges.get(key)!;
      }
      const perm = userPermissions?.find(
        (p) => p.entity === entity && p.operation === operation
      );
      return perm?.granted ?? false;
    },
    [userPermissions, userPendingChanges]
  );

  const handleUserToggle = useCallback(
    (entity: string, operation: string) => {
      if (selectedUser?.role === 'SUPER_ADMIN') return;
      const key = permissionKey(entity, operation);
      const current = getUserGranted(entity, operation);
      setUserPendingChanges((prev) => {
        const next = new Map(prev);
        next.set(key, !current);
        return next;
      });
    },
    [getUserGranted, selectedUser]
  );

  // ─── Save User Permissions ─────────────────────────────────────────────────

  const handleSaveUser = useCallback(async () => {
    if (!selectedUser || userPendingChanges.size === 0) return;

    const updates: PermissionUpdate[] = [];
    userPendingChanges.forEach((granted, key) => {
      const [entity, operation] = key.split(':');
      updates.push({ entity, operation, granted });
    });

    try {
      setSaving(true);
      await axiosInstance.put(`/permissions/users/${selectedUser.id}`, updates);
      // Reload user permissions
      const response = await axiosInstance.get<{ data: UserPermissionResponse }>(
        `/permissions/users/${selectedUser.id}`
      );
      setUserPermissions(response.data.data.permissions);
      setUserPendingChanges(new Map());
    } catch {
      setError('Failed to save user permissions.');
    } finally {
      setSaving(false);
    }
  }, [selectedUser, userPendingChanges]);

  // ─── Derived Data ──────────────────────────────────────────────────────────

  const entities = matrix?.entities || [];
  const operations = matrix?.operations || [];

  const currentRole = useMemo(() => {
    if (activeTab < ROLES.length) return ROLES[activeTab];
    return null;
  }, [activeTab]);

  const hasPendingChanges = useMemo(() => {
    if (currentRole) {
      return (pendingChanges[currentRole]?.size || 0) > 0;
    }
    return userPendingChanges.size > 0;
  }, [currentRole, pendingChanges, userPendingChanges]);

  // ─── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Box className="flex justify-center items-center min-h-[400px]">
        <CircularProgress />
      </Box>
    );
  }

  if (error && !matrix) {
    return (
      <Box className="p-4">
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box className="p-4 space-y-4">
      <Box className="flex items-center justify-between">
        <Typography variant="h4" component="h1" fontWeight="bold">
          Permission Management
        </Typography>
        {hasPendingChanges && (
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={saving}
            onClick={() => {
              if (currentRole) {
                handleSaveRole(currentRole);
              } else {
                handleSaveUser();
              }
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Tabs: one per role + User Override */}
      <Paper elevation={1}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {ROLES.map((role) => (
            <Tab
              key={role}
              label={
                <Box className="flex items-center gap-1">
                  {ROLE_LABELS[role]}
                  {role === 'SUPER_ADMIN' && (
                    <LockIcon fontSize="small" color="disabled" />
                  )}
                </Box>
              }
            />
          ))}
          <Tab
            label={
              <Box className="flex items-center gap-1">
                <PersonSearchIcon fontSize="small" />
                User Override
              </Box>
            }
          />
        </Tabs>
      </Paper>

      {/* Role Matrix Tab */}
      {currentRole && (
        <Paper elevation={2}>
          {currentRole === 'SUPER_ADMIN' && (
            <Alert severity="info" className="m-2">
              Super Admin has full access to all entities. Permissions cannot be modified.
            </Alert>
          )}

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', minWidth: 180 }}>
                    Entity
                  </TableCell>
                  {operations.map((op) => (
                    <TableCell key={op} align="center" sx={{ fontWeight: 'bold' }}>
                      {OPERATION_LABELS[op] || op}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {entities.map((entity) => (
                  <TableRow key={entity} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {formatEntity(entity)}
                      </Typography>
                    </TableCell>
                    {operations.map((op) => {
                      const granted = getGranted(currentRole, entity, op);
                      const isSuperAdmin = currentRole === 'SUPER_ADMIN';
                      const key = permissionKey(entity, op);
                      const isPending = pendingChanges[currentRole]?.has(key);

                      return (
                        <TableCell key={op} align="center">
                          {isSuperAdmin ? (
                            <Tooltip title="Always granted for Super Admin">
                              <Chip
                                label="Granted"
                                size="small"
                                color="success"
                                variant="filled"
                                icon={<LockIcon fontSize="small" />}
                              />
                            </Tooltip>
                          ) : (
                            <Tooltip
                              title={granted ? 'Revoke permission' : 'Grant permission'}
                            >
                              <Switch
                                checked={granted}
                                onChange={() => handleRoleToggle(currentRole, entity, op)}
                                color="primary"
                                size="small"
                                sx={
                                  isPending
                                    ? {
                                        '& .MuiSwitch-track': {
                                          border: '2px solid',
                                          borderColor: 'warning.main',
                                        },
                                      }
                                    : undefined
                                }
                              />
                            </Tooltip>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* User Override Tab */}
      {!currentRole && (
        <Paper elevation={2} className="p-4 space-y-4">
          <Typography variant="h6">Per-User Permission Override</Typography>
          <Typography variant="body2" color="text.secondary">
            Search for a user to view and override their individual permissions. Overrides
            take precedence over role-based defaults.
          </Typography>

          <Autocomplete
            options={userResults}
            getOptionLabel={(option) => `${option.name} (${option.email})`}
            value={selectedUser}
            onInputChange={(_, value) => handleUserSearch(value)}
            onChange={(_, value) => handleUserSelect(value)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search users by name or email"
                placeholder="Start typing..."
                variant="outlined"
                size="small"
              />
            )}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                <Box>
                  <Typography variant="body2" fontWeight={500}>
                    {option.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.email} &middot; {ROLE_LABELS[option.role] || option.role}
                  </Typography>
                </Box>
              </li>
            )}
            noOptionsText={userSearch.length < 2 ? 'Type at least 2 characters' : 'No users found'}
            loading={userLoading}
          />

          {selectedUser && selectedUser.role === 'SUPER_ADMIN' && (
            <Alert severity="info">
              Super Admin users have full access. Permissions cannot be overridden.
            </Alert>
          )}

          {selectedUser && userLoading && (
            <Box className="flex justify-center py-8">
              <CircularProgress size={32} />
            </Box>
          )}

          {selectedUser && userPermissions && selectedUser.role !== 'SUPER_ADMIN' && (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', minWidth: 180 }}>
                      Entity
                    </TableCell>
                    {operations.map((op) => (
                      <TableCell key={op} align="center" sx={{ fontWeight: 'bold' }}>
                        {OPERATION_LABELS[op] || op}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {entities.map((entity) => (
                    <TableRow key={entity} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {formatEntity(entity)}
                        </Typography>
                      </TableCell>
                      {operations.map((op) => {
                        const granted = getUserGranted(entity, op);
                        const perm = userPermissions.find(
                          (p) => p.entity === entity && p.operation === op
                        );
                        const source = perm?.source;
                        const key = permissionKey(entity, op);
                        const isPending = userPendingChanges.has(key);

                        return (
                          <TableCell key={op} align="center">
                            <Box className="flex flex-col items-center gap-0.5">
                              <Switch
                                checked={granted}
                                onChange={() => handleUserToggle(entity, op)}
                                color="primary"
                                size="small"
                                sx={
                                  isPending
                                    ? {
                                        '& .MuiSwitch-track': {
                                          border: '2px solid',
                                          borderColor: 'warning.main',
                                        },
                                      }
                                    : undefined
                                }
                              />
                              {source && (
                                <Chip
                                  label={
                                    source === 'USER_OVERRIDE'
                                      ? 'Override'
                                      : source === 'ROLE'
                                      ? 'Role'
                                      : 'Denied'
                                  }
                                  size="small"
                                  variant="outlined"
                                  color={
                                    source === 'USER_OVERRIDE'
                                      ? 'warning'
                                      : source === 'ROLE'
                                      ? 'info'
                                      : 'default'
                                  }
                                  sx={{ fontSize: '0.65rem', height: 18 }}
                                />
                              )}
                            </Box>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}
    </Box>
  );
}
