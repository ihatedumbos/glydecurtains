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
  TablePagination,
  Paper,
  Chip,
  Button,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Rating,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Snackbar,
  Tooltip,
  Stack,
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Reply as ReplyIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import axiosInstance from '@/api/axiosInstance';

// ─── Types ──────────────────────────────────────────────────────────────────

type FeedbackStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';

interface Feedback {
  id: number;
  userId: number;
  userName: string;
  productId: number;
  productName: string;
  rating: number;
  title: string;
  comment: string;
  status: FeedbackStatus;
  adminReply: string | null;
  repliedById: number | null;
  repliedByName: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const statusColors: Record<FeedbackStatus, 'warning' | 'success' | 'error'> = {
  PENDING_REVIEW: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
};

const statusLabels: Record<FeedbackStatus, string> = {
  PENDING_REVIEW: 'Pending Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function FeedbackManagementPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  // Filters
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | ''>('');
  const [ratingFilter, setRatingFilter] = useState<number | ''>('');
  const [productFilter, setProductFilter] = useState('');

  // Reply dialog
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [replyFeedbackId, setReplyFeedbackId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replySubmitting, setReplySubmitting] = useState(false);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // ─── Fetch Feedback ─────────────────────────────────────────────────────────

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        page,
        size: rowsPerPage,
      };
      if (statusFilter) params.status = statusFilter;

      const res = await axiosInstance.get('/feedback', { params });
      const data: PageResponse<Feedback> = res.data.data;
      let items = data.content || [];

      // Client-side filters for rating and product (API only supports status filter)
      if (ratingFilter !== '') {
        items = items.filter((f) => f.rating === ratingFilter);
      }
      if (productFilter.trim()) {
        const lower = productFilter.toLowerCase();
        items = items.filter((f) => f.productName?.toLowerCase().includes(lower));
      }

      setFeedbacks(items);
      setTotalElements(data.totalElements);
    } catch {
      setSnackbar({ open: true, message: 'Failed to load feedback', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, statusFilter, ratingFilter, productFilter]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  // ─── Actions ──────────────────────────────────────────────────────────────

  const handleApprove = async (id: number) => {
    try {
      await axiosInstance.put(`/feedback/${id}/approve`);
      setSnackbar({ open: true, message: 'Feedback approved', severity: 'success' });
      fetchFeedback();
    } catch {
      setSnackbar({ open: true, message: 'Failed to approve feedback', severity: 'error' });
    }
  };

  const handleReject = async (id: number) => {
    try {
      await axiosInstance.put(`/feedback/${id}/reject`);
      setSnackbar({ open: true, message: 'Feedback rejected', severity: 'success' });
      fetchFeedback();
    } catch {
      setSnackbar({ open: true, message: 'Failed to reject feedback', severity: 'error' });
    }
  };

  const handleOpenReply = (id: number) => {
    setReplyFeedbackId(id);
    setReplyText('');
    setReplyDialogOpen(true);
  };

  const handleSubmitReply = async () => {
    if (!replyFeedbackId || !replyText.trim()) return;
    setReplySubmitting(true);
    try {
      await axiosInstance.post(`/feedback/${replyFeedbackId}/reply`, { reply: replyText.trim() });
      setSnackbar({ open: true, message: 'Reply sent successfully', severity: 'success' });
      setReplyDialogOpen(false);
      fetchFeedback();
    } catch {
      setSnackbar({ open: true, message: 'Failed to send reply', severity: 'error' });
    } finally {
      setReplySubmitting(false);
    }
  };

  const handleClearFilters = () => {
    setStatusFilter('');
    setRatingFilter('');
    setProductFilter('');
    setPage(0);
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <Box p={3}>
      <Typography variant="h4" fontWeight={700} mb={3}>
        Feedback Management
      </Typography>

      {/* ─── Filters ─────────────────────────────────────────────────────── */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap">
          <FilterIcon color="action" />

          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as FeedbackStatus | '');
                setPage(0);
              }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="PENDING_REVIEW">Pending Review</MenuItem>
              <MenuItem value="APPROVED">Approved</MenuItem>
              <MenuItem value="REJECTED">Rejected</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Rating</InputLabel>
            <Select
              label="Rating"
              value={ratingFilter}
              onChange={(e) => {
                setRatingFilter(e.target.value as number | '');
                setPage(0);
              }}
            >
              <MenuItem value="">All</MenuItem>
              {[5, 4, 3, 2, 1].map((r) => (
                <MenuItem key={r} value={r}>
                  {r} Star{r > 1 ? 's' : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            size="small"
            label="Product"
            placeholder="Search by product name"
            value={productFilter}
            onChange={(e) => {
              setProductFilter(e.target.value);
              setPage(0);
            }}
            sx={{ minWidth: 200 }}
          />

          <Button
            size="small"
            startIcon={<ClearIcon />}
            onClick={handleClearFilters}
            disabled={!statusFilter && ratingFilter === '' && !productFilter}
          >
            Clear
          </Button>
        </Stack>
      </Paper>

      {/* ─── Table ───────────────────────────────────────────────────────── */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      ) : feedbacks.length === 0 ? (
        <Alert severity="info">No feedback found matching the current filters.</Alert>
      ) : (
        <Paper>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Product</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Rating</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {feedbacks.map((fb) => (
                  <TableRow key={fb.id} hover>
                    <TableCell>{fb.id}</TableCell>
                    <TableCell>{fb.productName}</TableCell>
                    <TableCell>{fb.userName}</TableCell>
                    <TableCell>
                      <Rating value={fb.rating} size="small" readOnly />
                    </TableCell>
                    <TableCell>
                      <Tooltip title={fb.comment || ''}>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                          {fb.title}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={statusLabels[fb.status]}
                        color={statusColors[fb.status]}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(fb.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        {fb.status === 'PENDING_REVIEW' && (
                          <>
                            <Tooltip title="Approve">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleApprove(fb.id)}
                              >
                                <ApproveIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleReject(fb.id)}
                              >
                                <RejectIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        <Tooltip title={fb.adminReply ? 'View/Edit Reply' : 'Reply'}>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenReply(fb.id)}
                          >
                            <ReplyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={totalElements}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[10, 20, 50]}
          />
        </Paper>
      )}

      {/* ─── Reply Dialog ────────────────────────────────────────────────── */}
      <Dialog open={replyDialogOpen} onClose={() => setReplyDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reply to Feedback</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={3}
            maxRows={8}
            label="Admin Reply"
            placeholder="Enter your response to the customer..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReplyDialogOpen(false)} disabled={replySubmitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitReply}
            disabled={!replyText.trim() || replySubmitting}
            startIcon={replySubmitting ? <CircularProgress size={16} /> : <ReplyIcon />}
          >
            {replySubmitting ? 'Sending...' : 'Send Reply'}
          </Button>
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
