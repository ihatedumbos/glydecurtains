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
  Checkbox,
  Divider,
  Card,
  CardContent,
  Grid,
  SelectChangeEvent,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  ArrowBack as BackIcon,
  Receipt as InvoiceIcon,
  Assignment as AssignIcon,
} from '@mui/icons-material';
import axiosInstance from '@/api/axiosInstance';

// ─── Types ──────────────────────────────────────────────────────────────────

type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PACKED' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED';

interface OrderItem {
  id: number;
  productId: number;
  variantId: number | null;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface OrderStatusHistory {
  id: number;
  fromStatus: string;
  toStatus: string;
  changedBy: number;
  changedAt: string;
  notes: string | null;
}

interface Order {
  id: number;
  orderNumber: string;
  userId: number;
  customerName: string;
  customerEmail: string;
  status: OrderStatus;
  subtotal: number;
  grandTotal: number;
  assignedEmployeeId: number | null;
  assignedEmployeeName: string | null;
  createdAt: string;
  updatedAt: string;
}

interface OrderDetail extends Order {
  items: OrderItem[];
  statusHistory: OrderStatusHistory[];
}

interface Employee {
  id: number;
  name: string;
  email: string;
}

interface PageData<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const ORDER_STATUSES: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PACKED', 'DISPATCHED', 'DELIVERED', 'CANCELLED'];

const STATUS_COLORS: Record<OrderStatus, 'warning' | 'info' | 'secondary' | 'primary' | 'success' | 'error'> = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  PACKED: 'secondary',
  DISPATCHED: 'primary',
  DELIVERED: 'success',
  CANCELLED: 'error',
};

const STATUS_FLOW: Record<string, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PACKED', 'CANCELLED'],
  PACKED: ['DISPATCHED'],
  DISPATCHED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function OrderManagementPage() {
  // View mode: 'list' or 'detail'
  const [view, setView] = useState<'list' | 'detail'>('list');

  // Order list state
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [totalElements, setTotalElements] = useState(0);

  // Search & filters
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<OrderStatus | ''>('');
  const [filterCustomer, setFilterCustomer] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Bulk selection
  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState<string | null>(null);

  // Detail view
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Employee assignment
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignOrderId, setAssignOrderId] = useState<number | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | ''>('');
  const [assignLoading, setAssignLoading] = useState(false);

  // Status update
  const [statusLoading, setStatusLoading] = useState(false);

  // Invoice generation
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  // ─── Fetch Orders ───────────────────────────────────────────────────────

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, size };
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus;
      if (filterCustomer) params.customer = filterCustomer;
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;

      const response = await axiosInstance.get('/orders', { params });
      const data: PageData<Order> = response.data.data;
      setOrders(data.content);
      setTotalElements(data.totalElements);
    } catch {
      // Error handled by axios interceptor
    } finally {
      setLoading(false);
    }
  }, [page, size, search, filterStatus, filterCustomer, fromDate, toDate]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ─── Fetch Employees (for assignment) ───────────────────────────────────

  const fetchEmployees = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/employees', { params: { size: 100 } });
      const data = response.data.data;
      setEmployees(data.content || data || []);
    } catch {
      // Silently handle
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // ─── Fetch Order Detail ─────────────────────────────────────────────────

  const openOrderDetail = async (orderId: number) => {
    setView('detail');
    setDetailLoading(true);
    try {
      const response = await axiosInstance.get(`/orders/${orderId}`);
      setOrderDetail(response.data.data);
    } catch {
      // Error handled by axios interceptor
    } finally {
      setDetailLoading(false);
    }
  };

  const goBackToList = () => {
    setView('list');
    setOrderDetail(null);
  };

  // ─── Status Update ──────────────────────────────────────────────────────

  const handleStatusChange = async (orderId: number, newStatus: OrderStatus) => {
    setStatusLoading(true);
    try {
      await axiosInstance.put(`/orders/${orderId}/status`, { status: newStatus });
      // Refresh current view
      if (view === 'detail' && orderDetail) {
        await openOrderDetail(orderId);
      } else {
        await fetchOrders();
      }
    } catch {
      // Error handled by axios interceptor
    } finally {
      setStatusLoading(false);
    }
  };

  // ─── Employee Assignment ────────────────────────────────────────────────

  const openAssignDialog = (orderId: number) => {
    setAssignOrderId(orderId);
    setSelectedEmployeeId('');
    setAssignDialogOpen(true);
  };

  const handleAssignEmployee = async () => {
    if (!assignOrderId || !selectedEmployeeId) return;
    setAssignLoading(true);
    try {
      await axiosInstance.put(`/orders/${assignOrderId}/assign`, { employeeId: selectedEmployeeId });
      setAssignDialogOpen(false);
      if (view === 'detail' && orderDetail) {
        await openOrderDetail(assignOrderId);
      } else {
        await fetchOrders();
      }
    } catch {
      // Error handled by axios interceptor
    } finally {
      setAssignLoading(false);
    }
  };

  // ─── Invoice Generation ─────────────────────────────────────────────────

  const handleGenerateInvoice = async (orderId: number) => {
    setInvoiceLoading(true);
    try {
      await axiosInstance.post(`/invoices/orders/${orderId}/generate`);
      setBulkResult('Invoice generated successfully.');
      setTimeout(() => setBulkResult(null), 4000);
    } catch {
      // Error handled by axios interceptor
    } finally {
      setInvoiceLoading(false);
    }
  };

  const handleBulkGenerateInvoices = async () => {
    if (selectedOrderIds.length === 0) return;
    setBulkLoading(true);
    try {
      await axiosInstance.post('/invoices/bulk-generate', { orderIds: selectedOrderIds });
      setBulkResult(`Invoices generated for ${selectedOrderIds.length} order(s).`);
      setSelectedOrderIds([]);
      setTimeout(() => setBulkResult(null), 4000);
    } catch {
      // Error handled by axios interceptor
    } finally {
      setBulkLoading(false);
    }
  };

  // ─── Bulk Selection ─────────────────────────────────────────────────────

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrderIds(orders.map((o) => o.id));
    } else {
      setSelectedOrderIds([]);
    }
  };

  const handleSelectOrder = (orderId: number, checked: boolean) => {
    if (checked) {
      setSelectedOrderIds((prev) => [...prev, orderId]);
    } else {
      setSelectedOrderIds((prev) => prev.filter((id) => id !== orderId));
    }
  };

  // ─── Search Handler ─────────────────────────────────────────────────────

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setPage(0);
      fetchOrders();
    }
  };

  // ─── Render: Order Detail View ──────────────────────────────────────────

  if (view === 'detail') {
    return (
      <Box className="p-6 max-w-full">
        <Button startIcon={<BackIcon />} onClick={goBackToList} className="mb-4">
          Back to Orders
        </Button>

        {detailLoading ? (
          <Box className="flex justify-center py-12">
            <CircularProgress />
          </Box>
        ) : orderDetail ? (
          <Box>
            {/* Order Header */}
            <Paper className="p-6 mb-4">
              <Box className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <Box>
                  <Typography variant="h5" className="font-bold">
                    Order {orderDetail.orderNumber}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Placed on {formatDateTime(orderDetail.createdAt)}
                  </Typography>
                </Box>
                <Box className="flex items-center gap-3">
                  <Chip
                    label={orderDetail.status}
                    color={STATUS_COLORS[orderDetail.status]}
                    variant="filled"
                  />
                  {/* Status Update Dropdown */}
                  {STATUS_FLOW[orderDetail.status]?.length > 0 && (
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                      <InputLabel>Update Status</InputLabel>
                      <Select
                        value=""
                        label="Update Status"
                        onChange={(e: SelectChangeEvent) =>
                          handleStatusChange(orderDetail.id, e.target.value as OrderStatus)
                        }
                        disabled={statusLoading}
                      >
                        {STATUS_FLOW[orderDetail.status].map((s) => (
                          <MenuItem key={s} value={s}>{s}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                </Box>
              </Box>

              {/* Action Buttons */}
              <Box className="flex flex-wrap gap-2">
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<InvoiceIcon />}
                  onClick={() => handleGenerateInvoice(orderDetail.id)}
                  disabled={invoiceLoading}
                >
                  {invoiceLoading ? 'Generating...' : 'Generate Invoice'}
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AssignIcon />}
                  onClick={() => openAssignDialog(orderDetail.id)}
                >
                  Assign Employee
                </Button>
              </Box>
            </Paper>

            {/* Customer & Assignment Info */}
            <Grid container spacing={3} className="mb-4">
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" className="mb-2">
                      Customer Information
                    </Typography>
                    <Typography variant="body1" className="font-medium">
                      {orderDetail.customerName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {orderDetail.customerEmail}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary" className="mb-2">
                      Assigned Employee
                    </Typography>
                    {orderDetail.assignedEmployeeName ? (
                      <Typography variant="body1" className="font-medium">
                        {orderDetail.assignedEmployeeName}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary" className="italic">
                        No employee assigned
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Line Items */}
            <Paper className="p-4 mb-4">
              <Typography variant="subtitle1" className="font-bold mb-3">
                Order Items
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell align="right">Unit Price</TableCell>
                      <TableCell align="right">Qty</TableCell>
                      <TableCell align="right">Subtotal</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {orderDetail.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">{formatCurrency(item.subtotal)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={3} align="right" className="font-bold">
                        Grand Total
                      </TableCell>
                      <TableCell align="right" className="font-bold">
                        {formatCurrency(orderDetail.grandTotal)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            {/* Status History */}
            <Paper className="p-4">
              <Typography variant="subtitle1" className="font-bold mb-3">
                Status History
              </Typography>
              {orderDetail.statusHistory && orderDetail.statusHistory.length > 0 ? (
                <Box className="pl-2">
                  {orderDetail.statusHistory.map((entry, idx) => (
                    <Box key={entry.id} className="flex items-start gap-3 mb-3">
                      <Box
                        className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                        sx={{
                          backgroundColor:
                            idx === 0 ? 'primary.main' : 'grey.400',
                        }}
                      />
                      <Box>
                        <Typography variant="body2" className="font-medium">
                          {entry.fromStatus || 'Created'} → {entry.toStatus}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDateTime(entry.changedAt)}
                          {entry.notes && ` — ${entry.notes}`}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No status changes recorded yet.
                </Typography>
              )}
            </Paper>
          </Box>
        ) : (
          <Typography color="text.secondary">Order not found.</Typography>
        )}
      </Box>
    );
  }

  // ─── Render: Order List View ────────────────────────────────────────────

  return (
    <Box className="p-6 max-w-full">
      <Typography variant="h4" className="font-bold mb-6">
        Order Management
      </Typography>

      {/* Bulk Result Notification */}
      {bulkResult && (
        <Alert severity="success" className="mb-4" onClose={() => setBulkResult(null)}>
          {bulkResult}
        </Alert>
      )}

      {/* Search & Filters */}
      <Paper className="p-4 mb-4">
        <Box className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <TextField
            label="Search order # or customer"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
                setFilterStatus(e.target.value as OrderStatus | '');
                setPage(0);
              }}
            >
              <MenuItem value="">All</MenuItem>
              {ORDER_STATUSES.map((s) => (
                <MenuItem key={s} value={s}>{s}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="From date"
            type="date"
            size="small"
            value={fromDate}
            onChange={(e) => { setFromDate(e.target.value); setPage(0); }}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="To date"
            type="date"
            size="small"
            value={toDate}
            onChange={(e) => { setToDate(e.target.value); setPage(0); }}
            InputLabelProps={{ shrink: true }}
          />
        </Box>

        <Box className="flex flex-wrap items-center justify-between gap-2">
          <TextField
            label="Filter by customer name"
            size="small"
            value={filterCustomer}
            onChange={(e) => setFilterCustomer(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            sx={{ minWidth: 220 }}
          />
          <Box className="flex gap-2">
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setSearch('');
                setFilterStatus('');
                setFilterCustomer('');
                setFromDate('');
                setToDate('');
                setPage(0);
              }}
            >
              Clear Filters
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Bulk Actions Bar */}
      {selectedOrderIds.length > 0 && (
        <Paper className="p-3 mb-4 flex items-center gap-4">
          <Typography variant="body2" className="font-medium">
            {selectedOrderIds.length} order(s) selected
          </Typography>
          <Button
            variant="contained"
            size="small"
            startIcon={<InvoiceIcon />}
            onClick={handleBulkGenerateInvoices}
            disabled={bulkLoading}
          >
            {bulkLoading ? 'Generating...' : 'Generate Invoices'}
          </Button>
          <Button
            variant="text"
            size="small"
            onClick={() => setSelectedOrderIds([])}
          >
            Clear Selection
          </Button>
        </Paper>
      )}

      {/* Orders Table */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selectedOrderIds.length > 0 && selectedOrderIds.length < orders.length}
                  checked={orders.length > 0 && selectedOrderIds.length === orders.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </TableCell>
              <TableCell>Order #</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell>Assigned To</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" className="py-8">
                  <CircularProgress size={32} />
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" className="py-8 text-[#6b5d52]">
                  No orders found
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedOrderIds.includes(order.id)}
                      onChange={(e) => handleSelectOrder(order.id, e.target.checked)}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-sm">{order.orderNumber}</TableCell>
                  <TableCell>
                    <Typography variant="body2">{order.customerName}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {order.customerEmail}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {/* Inline status update */}
                    {STATUS_FLOW[order.status]?.length > 0 ? (
                      <FormControl size="small" variant="standard" sx={{ minWidth: 120 }}>
                        <Select
                          value={order.status}
                          onChange={(e: SelectChangeEvent) => {
                            if (e.target.value !== order.status) {
                              handleStatusChange(order.id, e.target.value as OrderStatus);
                            }
                          }}
                          disabled={statusLoading}
                          renderValue={(value) => (
                            <Chip
                              label={value}
                              size="small"
                              color={STATUS_COLORS[value as OrderStatus]}
                              variant="outlined"
                            />
                          )}
                        >
                          <MenuItem value={order.status} disabled>
                            {order.status} (current)
                          </MenuItem>
                          <Divider />
                          {STATUS_FLOW[order.status].map((s) => (
                            <MenuItem key={s} value={s}>{s}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    ) : (
                      <Chip
                        label={order.status}
                        size="small"
                        color={STATUS_COLORS[order.status]}
                        variant="outlined"
                      />
                    )}
                  </TableCell>
                  <TableCell align="right">{formatCurrency(order.grandTotal)}</TableCell>
                  <TableCell>
                    {order.assignedEmployeeName || (
                      <Typography variant="caption" color="text.secondary">—</Typography>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(order.createdAt)}</TableCell>
                  <TableCell align="center">
                    <Box className="flex items-center justify-center gap-1">
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => openOrderDetail(order.id)}>
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Assign Employee">
                        <IconButton size="small" onClick={() => openAssignDialog(order.id)}>
                          <AssignIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Generate Invoice">
                        <IconButton
                          size="small"
                          onClick={() => handleGenerateInvoice(order.id)}
                          disabled={invoiceLoading}
                        >
                          <InvoiceIcon fontSize="small" />
                        </IconButton>
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

      {/* Employee Assignment Dialog */}
      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Assign Employee to Order</DialogTitle>
        <DialogContent>
          <FormControl fullWidth size="small" className="mt-2">
            <InputLabel>Select Employee</InputLabel>
            <Select
              value={selectedEmployeeId as string}
              label="Select Employee"
              onChange={(e: SelectChangeEvent) => setSelectedEmployeeId(Number(e.target.value))}
            >
              {employees.map((emp) => (
                <MenuItem key={emp.id} value={emp.id}>
                  {emp.name} ({emp.email})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAssignEmployee}
            disabled={!selectedEmployeeId || assignLoading}
          >
            {assignLoading ? 'Assigning...' : 'Assign'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
