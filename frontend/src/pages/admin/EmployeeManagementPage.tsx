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
  Switch,
  Grid,
  SelectChangeEvent,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Block as SuspendIcon,
  PlayArrow as ActivateIcon,
  Delete as DeleteIcon,
  Assignment as TaskIcon,
  Security as PermissionIcon,
} from '@mui/icons-material';
import axiosInstance from '@/api/axiosInstance';

// ─── Types ──────────────────────────────────────────────────────────────────

type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'EMPLOYEE' | 'CUSTOMER';
type UserStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'DEACTIVATED';
type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

interface Employee {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  departmentId: number | null;
  departmentName: string | null;
  hireDate: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Department {
  id: number;
  name: string;
  description?: string;
}

interface TaskItem {
  id: number;
  title: string;
  description: string;
  assignedToId: number;
  assignedToName: string;
  assignedById: number;
  assignedByName: string;
  status: TaskStatus;
  createdAt: string;
}

interface ResolvedPermission {
  entity: string;
  operation: string;
  granted: boolean;
  source: string;
}

interface PageData<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const EMPLOYEE_ROLES: UserRole[] = ['ADMIN', 'EMPLOYEE'];
const STATUSES: UserStatus[] = ['APPROVED', 'SUSPENDED', 'DEACTIVATED'];

const STATUS_COLORS: Record<UserStatus, 'warning' | 'success' | 'error' | 'default' | 'info'> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
  SUSPENDED: 'error',
  DEACTIVATED: 'default',
};

const PERMISSION_MODULES = [
  'products',
  'categories',
  'orders',
  'users',
  'employees',
  'cms',
  'reports',
  'dashboard',
  'enquiries',
  'feedback',
  'achievements',
  'stores',
  'permissions',
  'invoices',
];

const CRUD_OPERATIONS = ['CREATE', 'READ', 'UPDATE', 'DELETE'];

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function EmployeeManagementPage() {
  // Employee list state
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [totalElements, setTotalElements] = useState(0);

  // Search & filters
  const [searchName, setSearchName] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [filterStatus, setFilterStatus] = useState<UserStatus | ''>('');
  const [filterDepartment, setFilterDepartment] = useState<number | ''>('');

  // Departments (extracted from employee data or fetched)
  const [departments, setDepartments] = useState<Department[]>([]);

  // Action state
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Create Employee dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'EMPLOYEE' as UserRole,
    departmentId: '' as number | '',
    hireDate: '',
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  // Permission dialog
  const [permDialogOpen, setPermDialogOpen] = useState(false);
  const [permEmployee, setPermEmployee] = useState<Employee | null>(null);
  const [permLoading, setPermLoading] = useState(false);
  const [permSaving, setPermSaving] = useState(false);
  const [permissionGrid, setPermissionGrid] = useState<Record<string, Record<string, boolean>>>({});

  // Task dialog
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskEmployee, setTaskEmployee] = useState<Employee | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [taskLoading, setTaskLoading] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [taskSaving, setTaskSaving] = useState(false);

  // Department assignment dialog
  const [deptDialogOpen, setDeptDialogOpen] = useState(false);
  const [deptEmployee, setDeptEmployee] = useState<Employee | null>(null);
  const [selectedDeptId, setSelectedDeptId] = useState<number | ''>('');
  const [deptSaving, setDeptSaving] = useState(false);

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteEmployee, setDeleteEmployee] = useState<Employee | null>(null);

  // ─── Fetch Employees ────────────────────────────────────────────────────

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, size };
      if (searchName) params.name = searchName;
      if (searchEmail) params.email = searchEmail;
      if (filterStatus) params.status = filterStatus;
      if (filterDepartment) params.departmentId = filterDepartment;

      const response = await axiosInstance.get('/employees', { params });
      const data: PageData<Employee> = response.data.data;
      setEmployees(data.content);
      setTotalElements(data.totalElements);

      // Extract unique departments from response
      const deptMap = new Map<number, Department>();
      data.content.forEach((emp) => {
        if (emp.departmentId && emp.departmentName) {
          deptMap.set(emp.departmentId, { id: emp.departmentId, name: emp.departmentName });
        }
      });
      if (deptMap.size > 0) {
        setDepartments((prev) => {
          const merged = new Map(prev.map((d) => [d.id, d]));
          deptMap.forEach((v, k) => merged.set(k, v));
          return Array.from(merged.values());
        });
      }
    } catch {
      // Error handled by axios interceptor
    } finally {
      setLoading(false);
    }
  }, [page, size, searchName, searchEmail, filterStatus, filterDepartment]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // ─── Create Employee ────────────────────────────────────────────────────

  const handleCreateEmployee = async () => {
    setCreateLoading(true);
    setCreateError('');
    try {
      const payload: Record<string, unknown> = {
        name: createForm.name,
        email: createForm.email,
        password: createForm.password,
        role: createForm.role,
      };
      if (createForm.departmentId) payload.departmentId = createForm.departmentId;
      if (createForm.hireDate) payload.hireDate = createForm.hireDate;

      await axiosInstance.post('/employees', payload);
      setCreateDialogOpen(false);
      setCreateForm({ name: '', email: '', password: '', role: 'EMPLOYEE', departmentId: '', hireDate: '' });
      await fetchEmployees();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setCreateError(error?.response?.data?.message || 'Failed to create employee');
    } finally {
      setCreateLoading(false);
    }
  };

  // ─── Employee Actions ───────────────────────────────────────────────────

  const handleSuspend = async (id: number) => {
    setActionLoading(id);
    try {
      await axiosInstance.put(`/employees/${id}/suspend`);
      await fetchEmployees();
    } catch {
      // handled by interceptor
    } finally {
      setActionLoading(null);
    }
  };

  const handleActivate = async (id: number) => {
    setActionLoading(id);
    try {
      await axiosInstance.put(`/employees/${id}/activate`);
      await fetchEmployees();
    } catch {
      // handled by interceptor
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteEmployee) return;
    setActionLoading(deleteEmployee.id);
    try {
      await axiosInstance.delete(`/employees/${deleteEmployee.id}`);
      setDeleteDialogOpen(false);
      setDeleteEmployee(null);
      await fetchEmployees();
    } catch {
      // handled by interceptor
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Permissions ────────────────────────────────────────────────────────

  const openPermissions = async (emp: Employee) => {
    setPermEmployee(emp);
    setPermDialogOpen(true);
    setPermLoading(true);
    try {
      const response = await axiosInstance.get(`/permissions/users/${emp.id}`);
      const perms: ResolvedPermission[] = response.data.data.permissions || [];
      // Build grid
      const grid: Record<string, Record<string, boolean>> = {};
      PERMISSION_MODULES.forEach((mod) => {
        grid[mod] = {};
        CRUD_OPERATIONS.forEach((op) => {
          grid[mod][op] = false;
        });
      });
      perms.forEach((p) => {
        if (grid[p.entity]) {
          grid[p.entity][p.operation] = p.granted;
        }
      });
      setPermissionGrid(grid);
    } catch {
      setPermissionGrid({});
    } finally {
      setPermLoading(false);
    }
  };

  const handlePermissionToggle = (entity: string, operation: string) => {
    setPermissionGrid((prev) => ({
      ...prev,
      [entity]: {
        ...prev[entity],
        [operation]: !prev[entity][operation],
      },
    }));
  };

  const handleSavePermissions = async () => {
    if (!permEmployee) return;
    setPermSaving(true);
    try {
      const updates: { entity: string; operation: string; granted: boolean }[] = [];
      Object.entries(permissionGrid).forEach(([entity, ops]) => {
        Object.entries(ops).forEach(([operation, granted]) => {
          updates.push({ entity, operation, granted });
        });
      });
      await axiosInstance.put(`/permissions/users/${permEmployee.id}`, updates);
      setPermDialogOpen(false);
    } catch {
      // handled by interceptor
    } finally {
      setPermSaving(false);
    }
  };

  // ─── Department Assignment ──────────────────────────────────────────────

  const openDeptAssign = (emp: Employee) => {
    setDeptEmployee(emp);
    setSelectedDeptId(emp.departmentId || '');
    setDeptDialogOpen(true);
  };

  const handleAssignDepartment = async () => {
    if (!deptEmployee || !selectedDeptId) return;
    setDeptSaving(true);
    try {
      await axiosInstance.put(`/employees/${deptEmployee.id}/department/${selectedDeptId}`);
      setDeptDialogOpen(false);
      await fetchEmployees();
    } catch {
      // handled by interceptor
    } finally {
      setDeptSaving(false);
    }
  };

  // ─── Task Assignment ────────────────────────────────────────────────────

  const openTasks = async (emp: Employee) => {
    setTaskEmployee(emp);
    setTaskDialogOpen(true);
    setTaskLoading(true);
    try {
      const response = await axiosInstance.get(`/employees/${emp.id}/tasks`);
      setTasks(response.data.data || []);
    } catch {
      setTasks([]);
    } finally {
      setTaskLoading(false);
    }
  };

  const handleAssignTask = async () => {
    if (!taskEmployee || !newTaskTitle.trim()) return;
    setTaskSaving(true);
    try {
      await axiosInstance.post(`/employees/${taskEmployee.id}/tasks`, {
        title: newTaskTitle,
        description: newTaskDescription,
      });
      setNewTaskTitle('');
      setNewTaskDescription('');
      // Refresh tasks
      const response = await axiosInstance.get(`/employees/${taskEmployee.id}/tasks`);
      setTasks(response.data.data || []);
    } catch {
      // handled by interceptor
    } finally {
      setTaskSaving(false);
    }
  };

  // ─── Helpers ────────────────────────────────────────────────────────────

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setPage(0);
      fetchEmployees();
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <Box className="p-6 max-w-full">
      <Box className="flex items-center justify-between mb-6">
        <Typography variant="h4" className="font-bold">
          Employee Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Add Employee
        </Button>
      </Box>

      {/* Search & Filters */}
      <Paper className="p-4 mb-4">
        <Box className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          <FormControl size="small">
            <InputLabel>Department</InputLabel>
            <Select
              value={filterDepartment === '' ? '' : String(filterDepartment)}
              label="Department"
              onChange={(e: SelectChangeEvent) => {
                setFilterDepartment(e.target.value ? Number(e.target.value) : '');
                setPage(0);
              }}
            >
              <MenuItem value="">All</MenuItem>
              {departments.map((d) => (
                <MenuItem key={d.id} value={String(d.id)}>{d.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <Box className="flex justify-end mt-3">
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              setSearchName('');
              setSearchEmail('');
              setFilterStatus('');
              setFilterDepartment('');
              setPage(0);
            }}
          >
            Clear Filters
          </Button>
        </Box>
      </Paper>

      {/* Employee Table */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Department</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Hire Date</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" className="py-8">
                  <CircularProgress size={32} />
                </TableCell>
              </TableRow>
            ) : employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" className="py-8 text-gray-500">
                  No employees found
                </TableCell>
              </TableRow>
            ) : (
              employees.map((emp) => (
                <TableRow key={emp.id} hover>
                  <TableCell>{emp.name}</TableCell>
                  <TableCell>{emp.email}</TableCell>
                  <TableCell>
                    <Chip label={emp.role.replace(/_/g, ' ')} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Box className="flex items-center gap-1">
                      <span>{emp.departmentName || '—'}</span>
                      <Tooltip title="Assign Department">
                        <IconButton size="small" onClick={() => openDeptAssign(emp)}>
                          <Typography variant="caption" color="primary">✎</Typography>
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={emp.status}
                      size="small"
                      color={STATUS_COLORS[emp.status]}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{formatDate(emp.hireDate)}</TableCell>
                  <TableCell align="center">
                    <Box className="flex items-center justify-center gap-1 flex-nowrap">
                      {/* Permissions */}
                      <Tooltip title="Manage Permissions">
                        <span>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => openPermissions(emp)}
                            disabled={actionLoading === emp.id}
                          >
                            <PermissionIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>

                      {/* Tasks */}
                      <Tooltip title="Tasks">
                        <span>
                          <IconButton
                            size="small"
                            color="info"
                            onClick={() => openTasks(emp)}
                            disabled={actionLoading === emp.id}
                          >
                            <TaskIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>

                      {/* Suspend / Activate */}
                      {emp.status === 'APPROVED' && (
                        <Tooltip title="Suspend">
                          <span>
                            <IconButton
                              size="small"
                              color="warning"
                              onClick={() => handleSuspend(emp.id)}
                              disabled={actionLoading === emp.id}
                            >
                              {actionLoading === emp.id ? <CircularProgress size={16} /> : <SuspendIcon fontSize="small" />}
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}
                      {(emp.status === 'SUSPENDED' || emp.status === 'DEACTIVATED') && (
                        <Tooltip title="Activate">
                          <span>
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleActivate(emp.id)}
                              disabled={actionLoading === emp.id}
                            >
                              {actionLoading === emp.id ? <CircularProgress size={16} /> : <ActivateIcon fontSize="small" />}
                            </IconButton>
                          </span>
                        </Tooltip>
                      )}

                      {/* Delete */}
                      <Tooltip title="Delete (Deactivate)">
                        <span>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => { setDeleteEmployee(emp); setDeleteDialogOpen(true); }}
                            disabled={actionLoading === emp.id}
                          >
                            <DeleteIcon fontSize="small" />
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

      {/* ─── Create Employee Dialog ─────────────────────────────────────────── */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Employee</DialogTitle>
        <DialogContent>
          {createError && (
            <Alert severity="error" className="mb-4" onClose={() => setCreateError('')}>
              {createError}
            </Alert>
          )}
          <Box className="flex flex-col gap-4 mt-2">
            <TextField
              label="Full Name"
              required
              fullWidth
              value={createForm.name}
              onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
            />
            <TextField
              label="Email"
              type="email"
              required
              fullWidth
              value={createForm.email}
              onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
            />
            <TextField
              label="Initial Password"
              type="password"
              required
              fullWidth
              helperText="Minimum 6 characters"
              value={createForm.password}
              onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                value={createForm.role}
                label="Role"
                onChange={(e: SelectChangeEvent) => setCreateForm((f) => ({ ...f, role: e.target.value as UserRole }))}
              >
                {EMPLOYEE_ROLES.map((r) => (
                  <MenuItem key={r} value={r}>{r.replace(/_/g, ' ')}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Department (optional)</InputLabel>
              <Select
                value={createForm.departmentId === '' ? '' : String(createForm.departmentId)}
                label="Department (optional)"
                onChange={(e: SelectChangeEvent) => setCreateForm((f) => ({ ...f, departmentId: e.target.value ? Number(e.target.value) : '' }))}
              >
                <MenuItem value="">None</MenuItem>
                {departments.map((d) => (
                  <MenuItem key={d.id} value={String(d.id)}>{d.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Hire Date (optional)"
              type="date"
              fullWidth
              value={createForm.hireDate}
              onChange={(e) => setCreateForm((f) => ({ ...f, hireDate: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateEmployee}
            disabled={createLoading || !createForm.name || !createForm.email || !createForm.password}
          >
            {createLoading ? <CircularProgress size={20} /> : 'Create Employee'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Permission Assignment Dialog ──────────────────────────────────── */}
      <Dialog open={permDialogOpen} onClose={() => setPermDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Permissions — {permEmployee?.name}
        </DialogTitle>
        <DialogContent dividers>
          {permLoading ? (
            <Box className="flex justify-center py-8">
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Module</TableCell>
                    {CRUD_OPERATIONS.map((op) => (
                      <TableCell key={op} align="center" sx={{ fontWeight: 'bold' }}>
                        {op}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {PERMISSION_MODULES.map((mod) => (
                    <TableRow key={mod} hover>
                      <TableCell sx={{ textTransform: 'capitalize' }}>
                        {mod}
                      </TableCell>
                      {CRUD_OPERATIONS.map((op) => (
                        <TableCell key={op} align="center">
                          <Switch
                            size="small"
                            checked={permissionGrid[mod]?.[op] || false}
                            onChange={() => handlePermissionToggle(mod, op)}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPermDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSavePermissions}
            disabled={permSaving || permLoading}
          >
            {permSaving ? <CircularProgress size={20} /> : 'Save Permissions'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Department Assignment Dialog ──────────────────────────────────── */}
      <Dialog open={deptDialogOpen} onClose={() => setDeptDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Assign Department — {deptEmployee?.name}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth className="mt-4">
            <InputLabel>Department</InputLabel>
            <Select
              value={selectedDeptId === '' ? '' : String(selectedDeptId)}
              label="Department"
              onChange={(e: SelectChangeEvent) => setSelectedDeptId(e.target.value ? Number(e.target.value) : '')}
            >
              <MenuItem value="">None</MenuItem>
              {departments.map((d) => (
                <MenuItem key={d.id} value={String(d.id)}>{d.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeptDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAssignDepartment}
            disabled={deptSaving || !selectedDeptId}
          >
            {deptSaving ? <CircularProgress size={20} /> : 'Assign'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Task Assignment Dialog ────────────────────────────────────────── */}
      <Dialog open={taskDialogOpen} onClose={() => setTaskDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Tasks — {taskEmployee?.name}</DialogTitle>
        <DialogContent dividers>
          {/* New Task Form */}
          <Box className="mb-4">
            <Typography variant="subtitle2" className="mb-2">Assign New Task</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Task Title"
                  size="small"
                  fullWidth
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Description (optional)"
                  size="small"
                  fullWidth
                  multiline
                  rows={2}
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleAssignTask}
                  disabled={taskSaving || !newTaskTitle.trim()}
                >
                  {taskSaving ? <CircularProgress size={16} /> : 'Assign Task'}
                </Button>
              </Grid>
            </Grid>
          </Box>

          {/* Existing Tasks */}
          <Typography variant="subtitle2" className="mb-2">Existing Tasks</Typography>
          {taskLoading ? (
            <Box className="flex justify-center py-4">
              <CircularProgress size={24} />
            </Box>
          ) : tasks.length === 0 ? (
            <Typography variant="body2" className="text-gray-500">
              No tasks assigned yet.
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Assigned By</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <Tooltip title={task.description || ''}>
                        <span>{task.title}</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={task.status}
                        size="small"
                        color={
                          task.status === 'COMPLETED' ? 'success' :
                          task.status === 'IN_PROGRESS' ? 'info' :
                          task.status === 'CANCELLED' ? 'error' : 'default'
                        }
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{task.assignedByName}</TableCell>
                    <TableCell>{formatDate(task.createdAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTaskDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* ─── Delete Confirmation Dialog ────────────────────────────────────── */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to deactivate <strong>{deleteEmployee?.name}</strong>?
            This will revoke their access to the system.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={actionLoading !== null}
          >
            {actionLoading === deleteEmployee?.id ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
