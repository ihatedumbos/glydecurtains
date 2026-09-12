import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Tooltip,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  SelectChangeEvent,
} from '@mui/material';
import {
  Search as SearchIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Block as SuspendIcon,
  PlayArrow as ActivateIcon,
  Pause as DeactivateIcon,
  LockReset as ResetPasswordIcon,
  ExpandMore as ExpandMoreIcon,
  History as AuditIcon,
} from '@mui/icons-material';
import axiosInstance from '@/api/axiosInstance';

// ─── Types ──────────────────────────────────────────────────────────────────

type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'EMPLOYEE' | 'CUSTOMER';
type UserStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'DEACTIVATED';

interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  preferredLanguage: string;
  createdAt: string;
  updatedAt: string;
}

interface ActivityLog {
  id: number;
  userId: number;
  actionType: string;
  entityType: string;
  entityId: number;
  details: string;
  ipAddress: string;
  timestamp: string;
}

interface PageData<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const ROLES: UserRole[] = ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE', 'CUSTOMER'];
const STATUSES: UserStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED', 'DEACTIVATED'];

const STATUS_COLORS: Record<UserStatus, 'warning' | 'success' | 'error' | 'default'> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
  SUSPENDED: 'error',
  DEACTIVATED: 'default',
};

function formatRole(role: UserRole): string {
  return role.replace(/_/g, ' ');
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateTime(dateStr: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function UserManagementPage() {
  // User list state
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [totalElements, setTotalElements] = useState(0);

  // Search & filters
  const [searchName, setSearchName] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [filterRole, setFilterRole] = useState<UserRole | ''>('');
  const [filterStatus, setFilterStatus] = useState<UserStatus | ''>('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Action state
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Audit log dialog
  const [auditDialogOpen, setAuditDialogOpen] = useState(false);
  const [auditUser, setAuditUser] = useState<User | null>(null);
  const [auditLogs, setAuditLogs] = useState<ActivityLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  // Password reset confirmation
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetUserId, setResetUserId] = useState<number | null>(null);

  // ─── Fetch Users ────────────────────────────────────────────────────────

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, size };
      if (searchName) params.name = searchName;
      if (searchEmail) params.email = searchEmail;
      if (filterRole) params.role = filterRole;
      if (filterStatus) params.status = filterStatus;
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;

      const response = await axiosInstance.get('/users', { params });
      const data: PageData<User> = response.data.data;
      setUsers(data.content);
      setTotalElements(data.totalElements);
    } catch {
      // Error handled by axios interceptor
    } finally {
      setLoading(false);
    }
  }, [page, size, searchName, searchEmail, filterRole, filterStatus, fromDate, toDate]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ─── User Actions ───────────────────────────────────────────────────────

  const handleAction = async (userId: number, action: string) => {
    setActionLoading(userId);
    try {
      await axiosInstance.put(`/users/${userId}/${action}`);
      await fetchUsers();
    } catch {
      // Error handled by axios interceptor
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleChange = async (userId: number, newRole: UserRole) => {
    setActionLoading(userId);
    try {
      await axiosInstance.put(`/users/${userId}/role`, { role: newRole });
      await fetchUsers();
    } catch {
      // Error handled by axios interceptor
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetPassword = async () => {
    if (!resetUserId) return;
    setActionLoading(resetUserId);
    try {
      await axiosInstance.post(`/users/${resetUserId}/reset-password`);
      setResetDialogOpen(false);
      setResetUserId(null);
    } catch {
      // Error handled by axios interceptor
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Audit Log ──────────────────────────────────────────────────────────

  const openAuditLog = async (user: User) => {
    setAuditUser(user);
    setAuditDialogOpen(true);
    setAuditLoading(true);
    try {
      const response = await axiosInstance.get('/activity-logs', {
        params: {
          entityType: 'USER',
          userId: user.id,
          size: 50,
        },
      });
      setAuditLogs(response.data.data.content || []);
    } catch {
      setAuditLogs([]);
    } finally {
      setAuditLoading(false);
    }
  };

  // ─── Helpers ────────────────────────────────────────────────────────────

  const getAvailableActions = (user: User) => {
    const actions: { label: string; action: string; icon: React.ReactNode; color: 'success' | 'error' | 'warning' | 'info' }[] = [];
    switch (user.status) {
      case 'PENDING':
        actions.push({ label: 'Approve', action: 'approve', icon: <ApproveIcon fontSize="small" />, color: 'success' });
        actions.push({ label: 'Reject', action: 'reject', icon: <RejectIcon fontSize="small" />, color: 'error' });
        break;
      case 'APPROVED':
        actions.push({ label: 'Suspend', action: 'suspend', icon: <SuspendIcon fontSize="small" />, color: 'warning' });
        actions.push({ label: 'Deactivate', action: 'deactivate', icon: <DeactivateIcon fontSize="small" />, color: 'error' });
        break;
      case 'SUSPENDED':
        actions.push({ label: 'Activate', action: 'activate', icon: <ActivateIcon fontSize="small" />, color: 'success' });
        actions.push({ label: 'Deactivate', action: 'deactivate', icon: <DeactivateIcon fontSize="small" />, color: 'error' });
        break;
      case 'DEACTIVATED':
        actions.push({ label: 'Activate', action: 'activate', icon: <ActivateIcon fontSize="small" />, color: 'success' });
        break;
      case 'REJECTED':
        actions.push({ label: 'Approve', action: 'approve', icon: <ApproveIcon fontSize="small" />, color: 'success' });
        break;
    }
    return actions;
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setPage(0);
      fetchUsers();
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <Box className="p-6 max-w-full">
      <Typography variant="h4" className="font-bold mb-6">
        User Management
      </Typography>

      {/* Search & Filters */}
      <Paper className="p-4 mb-4">
        <Box className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <TextField
            label="Search by name"
            size="small"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            label="Search by email"
            size="small"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small">
            <InputLabel>Status</InputLabel>
            <Select
              value={filterStatus}
              label="Status"
              onChange={(e: SelectChangeEvent) => {
                setFilterStatus(e.target.value as UserStatus | '');
                setPage(0);
              }}
            >
              <MenuItem value="">All</MenuItem>
              {STATUSES.map((s) => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Accordion disableGutters elevation={0} className="border border-[#2c2c2c]/12 rounded">
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="body2" className="text-[#6b5d52]">
              Advanced Filters
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormControl size="small">
                <InputLabel>Role</InputLabel>
                <Select
                  value={filterRole}
                  label="Role"
                  onChange={(e: SelectChangeEvent) => {
                    setFilterRole(e.target.value as UserRole | '');
                    setPage(0);
                  }}
                >
                  <MenuItem value="">All</MenuItem>
                  {ROLES.map((r) => (
                    <MenuItem key={r} value={r}>{formatRole(r)}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Registered from"
                type="date"
                size="small"
                value={fromDate}
                onChange={(e) => { setFromDate(e.target.value); setPage(0); }}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Registered to"
                type="date"
                size="small"
                value={toDate}
                onChange={(e) => { setToDate(e.target.value); setPage(0); }}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          </AccordionDetails>
        </Accordion>

        <Box className="flex justify-end mt-3">
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              setSearchName('');
              setSearchEmail('');
              setFilterRole('');
              setFilterStatus('');
              setFromDate('');
              setToDate('');
              setPage(0);
            }}
          >
            Clear Filters
          </Button>
        </Box>
      </Paper>

      {/* User Table */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Registered</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" className="py-8">
                  <CircularProgress size={32} />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" className="py-8 text-[#6b5d52]">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {/* Role change dropdown */}
                    <FormControl size="small" variant="standard" sx={{ minWidth: 120 }}>
                      <Select
                        value={user.role}
                        onChange={(e: SelectChangeEvent) => handleRoleChange(user.id, e.target.value as UserRole)}
                        disabled={actionLoading === user.id}
                      >
                        {ROLES.map((r) => (
                          <MenuItem key={r} value={r}>{formatRole(r)}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.status}
                      size="small"
                      color={STATUS_COLORS[user.status]}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell align="center">
                    <Box className="flex items-center justify-center gap-1 flex-nowrap">
                      {/* Status actions */}
                      {getAvailableActions(user).map((a) => (
                        <Tooltip key={a.action} title={a.label}>
                          <span>
                            <IconButton
                              size="small"
                              color={a.color}
                              onClick={() => handleAction(user.id, a.action)}
                              disabled={actionLoading === user.id}
                            >
                              {actionLoading === user.id ? <CircularProgress size={16} /> : a.icon}
                            </IconButton>
                          </span>
                        </Tooltip>
                      ))}

                      {/* Password Reset */}
                      <Tooltip title="Reset Password">
                        <span>
                          <IconButton
                            size="small"
                            color="info"
                            onClick={() => { setResetUserId(user.id); setResetDialogOpen(true); }}
                            disabled={actionLoading === user.id}
                          >
                            <ResetPasswordIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>

                      {/* Audit Log */}
                      <Tooltip title="View Audit Log">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => openAuditLog(user)}
                          >
                            <AuditIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={totalElements}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={size}
          onRowsPerPageChange={(e) => { setSize(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[10, 20, 50]}
        />
      </TableContainer>

      {/* Password Reset Confirmation Dialog */}
      <Dialog open={resetDialogOpen} onClose={() => setResetDialogOpen(false)}>
        <DialogTitle>Confirm Password Reset</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to reset the password for this user? They will receive an email with a temporary password.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleResetPassword}
            disabled={actionLoading !== null}
          >
            Reset Password
          </Button>
        </DialogActions>
      </Dialog>

      {/* Audit Log Dialog */}
      <Dialog open={auditDialogOpen} onClose={() => setAuditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Audit Log — {auditUser?.name}
        </DialogTitle>
        <DialogContent dividers>
          {auditLoading ? (
            <Box className="flex justify-center py-8">
              <CircularProgress />
            </Box>
          ) : auditLogs.length === 0 ? (
            <Typography className="text-[#6b5d52] text-center py-4">
              No audit log entries found for this user.
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Action</TableCell>
                  <TableCell>Details</TableCell>
                  <TableCell>IP Address</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {auditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">{formatDateTime(log.timestamp)}</TableCell>
                    <TableCell>
                      <Chip label={log.actionType} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>{log.details}</TableCell>
                    <TableCell className="text-[#6b5d52] text-sm">{log.ipAddress}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAuditDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
