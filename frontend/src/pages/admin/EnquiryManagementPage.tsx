import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Alert,
  Snackbar,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import axiosInstance from '@/api/axiosInstance';

// ─── Types ──────────────────────────────────────────────────────────────────

type EnquiryStatus = 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

interface Enquiry {
  id: number;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: EnquiryStatus;
  createdAt: string;
  updatedAt: string;
}

interface EnquiryReply {
  id: number;
  responderId: number;
  message: string;
  createdAt: string;
}

interface EnquiryDetail extends Enquiry {
  responses: EnquiryReply[];
}

interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const statusColors: Record<EnquiryStatus, 'default' | 'info' | 'success' | 'warning'> = {
  NEW: 'info',
  IN_PROGRESS: 'warning',
  RESOLVED: 'success',
  CLOSED: 'default',
};

const statusLabels: Record<EnquiryStatus, string> = {
  NEW: 'New',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString();
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function EnquiryManagementPage() {
  // List state
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [statusFilter, setStatusFilter] = useState<EnquiryStatus | ''>('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Detail state
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<EnquiryDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Reply state
  const [replyMessage, setReplyMessage] = useState('');
  const [replying, setReplying] = useState(false);

  // Status update state
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // ─── Fetch Enquiries ────────────────────────────────────────────────────────

  const fetchEnquiries = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, size: 20 };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;

      const res = await axiosInstance.get('/api/enquiries', { params });
      const data: PageResponse<Enquiry> = res.data.data;
      setEnquiries(data.content || []);
      setTotalPages(data.totalPages || 0);
    } catch {
      setSnackbar({ open: true, message: 'Failed to load enquiries', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => {
    fetchEnquiries();
  }, [fetchEnquiries]);

  // ─── Fetch Detail ───────────────────────────────────────────────────────────

  const handleViewDetail = async (id: number) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetail(null);
    setReplyMessage('');
    try {
      const res = await axiosInstance.get(`/api/enquiries/${id}`);
      setDetail(res.data.data);
    } catch {
      setSnackbar({ open: true, message: 'Failed to load enquiry details', severity: 'error' });
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  // ─── Status Update ──────────────────────────────────────────────────────────

  const handleStatusUpdate = async (newStatus: EnquiryStatus) => {
    if (!detail) return;
    setUpdatingStatus(true);
    try {
      await axiosInstance.put(`/api/enquiries/${detail.id}/status`, { status: newStatus });
      setDetail((prev) => (prev ? { ...prev, status: newStatus } : prev));
      setSnackbar({ open: true, message: 'Status updated successfully', severity: 'success' });
      fetchEnquiries();
    } catch {
      setSnackbar({ open: true, message: 'Failed to update status', severity: 'error' });
    } finally {
      setUpdatingStatus(false);
    }
  };

  // ─── Reply ──────────────────────────────────────────────────────────────────

  const handleReply = async () => {
    if (!detail || !replyMessage.trim()) return;
    setReplying(true);
    try {
      await axiosInstance.post(`/api/enquiries/${detail.id}/reply`, { message: replyMessage.trim() });
      setSnackbar({ open: true, message: 'Reply sent successfully', severity: 'success' });
      setReplyMessage('');
      // Refresh detail to show new reply
      const res = await axiosInstance.get(`/api/enquiries/${detail.id}`);
      setDetail(res.data.data);
      fetchEnquiries();
    } catch {
      setSnackbar({ open: true, message: 'Failed to send reply', severity: 'error' });
    } finally {
      setReplying(false);
    }
  };

  // ─── Search Handler ─────────────────────────────────────────────────────────

  const handleSearch = () => {
    setPage(0);
    setSearch(searchInput);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  // ─── Get available next statuses ───────────────────────────────────────────

  const getNextStatuses = (current: EnquiryStatus): EnquiryStatus[] => {
    switch (current) {
      case 'NEW':
        return ['IN_PROGRESS'];
      case 'IN_PROGRESS':
        return ['RESOLVED', 'CLOSED'];
      case 'RESOLVED':
        return ['CLOSED'];
      case 'CLOSED':
        return [];
      default:
        return [];
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <Box p={3}>
      <Box display="flex" alignItems="center" gap={1} mb={3}>
        <EmailIcon fontSize="large" color="primary" />
        <Typography variant="h4" fontWeight={700}>
          Enquiry Management
        </Typography>
      </Box>

      {/* ─── Filters ─────────────────────────────────────────────────────── */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
          <TextField
            size="small"
            placeholder="Search by name, email, or subject..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            sx={{ minWidth: 300 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={handleSearch}>
                    <SearchIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Status Filter</InputLabel>
            <Select
              label="Status Filter"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as EnquiryStatus | '');
                setPage(0);
              }}
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="NEW">New</MenuItem>
              <MenuItem value="IN_PROGRESS">In Progress</MenuItem>
              <MenuItem value="RESOLVED">Resolved</MenuItem>
              <MenuItem value="CLOSED">Closed</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* ─── Table ───────────────────────────────────────────────────────── */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      ) : enquiries.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">No enquiries found.</Typography>
        </Paper>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Subject</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {enquiries.map((enquiry) => (
                  <TableRow key={enquiry.id} hover>
                    <TableCell>{enquiry.id}</TableCell>
                    <TableCell>{enquiry.name}</TableCell>
                    <TableCell>{enquiry.email}</TableCell>
                    <TableCell>{enquiry.subject}</TableCell>
                    <TableCell>
                      <Chip
                        label={statusLabels[enquiry.status]}
                        color={statusColors[enquiry.status]}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatDate(enquiry.createdAt)}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        color="primary"
                        onClick={() => handleViewDetail(enquiry.id)}
                        title="View Details"
                      >
                        <VisibilityIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={2}>
              <Pagination
                count={totalPages}
                page={page + 1}
                onChange={(_, value) => setPage(value - 1)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      {/* ─── Detail Dialog ───────────────────────────────────────────────── */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6" fontWeight={600}>
              Enquiry #{detail?.id}
            </Typography>
            {detail && (
              <Chip
                label={statusLabels[detail.status]}
                color={statusColors[detail.status]}
                size="small"
              />
            )}
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {detailLoading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : detail ? (
            <Box>
              {/* Contact Info */}
              <Box mb={3}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Contact Information
                </Typography>
                <Box display="flex" gap={3} flexWrap="wrap">
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <EmailIcon fontSize="small" color="action" />
                    <Typography variant="body2">{detail.email}</Typography>
                  </Box>
                  {detail.phone && (
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <PhoneIcon fontSize="small" color="action" />
                      <Typography variant="body2">{detail.phone}</Typography>
                    </Box>
                  )}
                  <Typography variant="body2" color="text.secondary">
                    From: <strong>{detail.name}</strong>
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Subject & Message */}
              <Box mb={3}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  {detail.subject}
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'grey.50' }}>
                  <Typography variant="body2" whiteSpace="pre-wrap">
                    {detail.message}
                  </Typography>
                </Paper>
                <Typography variant="caption" color="text.secondary" mt={1} display="block">
                  Submitted: {formatDate(detail.createdAt)}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Status Update */}
              {getNextStatuses(detail.status).length > 0 && (
                <Box mb={3}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Update Status
                  </Typography>
                  <Box display="flex" gap={1}>
                    {getNextStatuses(detail.status).map((nextStatus) => (
                      <Button
                        key={nextStatus}
                        variant="outlined"
                        size="small"
                        disabled={updatingStatus}
                        onClick={() => handleStatusUpdate(nextStatus)}
                      >
                        Move to {statusLabels[nextStatus]}
                      </Button>
                    ))}
                  </Box>
                </Box>
              )}

              <Divider sx={{ my: 2 }} />

              {/* Response History */}
              <Box mb={3}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Response History ({detail.responses?.length || 0})
                </Typography>
                {detail.responses && detail.responses.length > 0 ? (
                  <Box display="flex" flexDirection="column" gap={1.5}>
                    {detail.responses.map((reply) => (
                      <Paper key={reply.id} variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="body2" whiteSpace="pre-wrap">
                          {reply.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" mt={1} display="block">
                          Replied: {formatDate(reply.createdAt)} • Responder #{reply.responderId}
                        </Typography>
                      </Paper>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No responses yet.
                  </Typography>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Reply Form */}
              {detail.status !== 'CLOSED' && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Send Reply
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    placeholder="Type your reply..."
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    disabled={replying}
                  />
                  <Box display="flex" justifyContent="flex-end" mt={1}>
                    <Button
                      variant="contained"
                      startIcon={<SendIcon />}
                      onClick={handleReply}
                      disabled={replying || !replyMessage.trim()}
                    >
                      {replying ? 'Sending...' : 'Send Reply'}
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>
          ) : (
            <Alert severity="error">Failed to load enquiry details.</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* ─── Snackbar ────────────────────────────────────────────────────── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
