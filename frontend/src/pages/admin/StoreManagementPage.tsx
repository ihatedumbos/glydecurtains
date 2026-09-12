import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Tooltip,
  InputAdornment,
  Alert,
  Chip,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import axiosInstance from '@/api/axiosInstance';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Store {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  latitude: number | null;
  longitude: number | null;
  operatingHours: string;
  imageBase64: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface StoreFormData {
  name: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  operatingHours: string;
  imageBase64: string;
}

interface PageData<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

interface FormErrors {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const EMPTY_FORM: StoreFormData = {
  name: '',
  address: '',
  city: '',
  state: '',
  phone: '',
  email: '',
  operatingHours: '',
  imageBase64: '',
};

const PHONE_REGEX = /^[+]?[0-9\s\-()]{7,20}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ─── Component ──────────────────────────────────────────────────────────────

export default function StoreManagementPage() {
  // List state
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [totalElements, setTotalElements] = useState(0);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // CRUD dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [form, setForm] = useState<StoreFormData>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Store | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ─── Fetch Stores ─────────────────────────────────────────────────────────

  const fetchStores = useCallback(async () => {
    setLoading(true);
    try {
      if (searchQuery.trim()) {
        // Use search endpoint for city/state filtering
        const response = await axiosInstance.get('/stores/public/search', {
          params: { query: searchQuery.trim() },
        });
        const data: Store[] = response.data.data;
        setStores(data);
        setTotalElements(data.length);
      } else {
        const response = await axiosInstance.get('/stores', {
          params: { page, size },
        });
        const data: PageData<Store> = response.data.data;
        setStores(data.content);
        setTotalElements(data.totalElements);
      }
    } catch {
      // Error handled by axios interceptor
    } finally {
      setLoading(false);
    }
  }, [page, size, searchQuery]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  // ─── Validation ───────────────────────────────────────────────────────────

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!form.name.trim()) errors.name = 'Store name is required';
    if (!form.address.trim()) errors.address = 'Address is required';
    if (!form.city.trim()) errors.city = 'City is required';
    if (!form.state.trim()) errors.state = 'State is required';
    if (!form.phone.trim()) {
      errors.phone = 'Phone is required';
    } else if (!PHONE_REGEX.test(form.phone.trim())) {
      errors.phone = 'Invalid phone format (7-20 digits, may include +, spaces, dashes, parentheses)';
    }
    if (form.email.trim() && !EMAIL_REGEX.test(form.email.trim())) {
      errors.email = 'Invalid email format';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ─── CRUD Handlers ────────────────────────────────────────────────────────

  const openCreateDialog = () => {
    setEditingStore(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setSaveError('');
    setDialogOpen(true);
  };

  const openEditDialog = (store: Store) => {
    setEditingStore(store);
    setForm({
      name: store.name || '',
      address: store.address || '',
      city: store.city || '',
      state: store.state || '',
      phone: store.phone || '',
      email: store.email || '',
      operatingHours: store.operatingHours || '',
      imageBase64: store.imageBase64 || '',
    });
    setFormErrors({});
    setSaveError('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    setSaveError('');
    try {
      const payload = {
        name: form.name.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        operatingHours: form.operatingHours.trim() || undefined,
        imageBase64: form.imageBase64 || undefined,
      };

      if (editingStore) {
        await axiosInstance.put(`/stores/${editingStore.id}`, payload);
      } else {
        await axiosInstance.post('/stores', payload);
      }

      setDialogOpen(false);
      await fetchStores();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setSaveError(error?.response?.data?.message || 'Failed to save store');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axiosInstance.delete(`/stores/${deleteTarget.id}`);
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      await fetchStores();
    } catch {
      // handled by interceptor
    } finally {
      setDeleting(false);
    }
  };

  // ─── Image Handling ───────────────────────────────────────────────────────

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setForm((f) => ({ ...f, imageBase64: base64 }));
    };
    reader.readAsDataURL(file);
  };

  // ─── Search ───────────────────────────────────────────────────────────────

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setPage(0);
      fetchStores();
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <Box className="p-6 max-w-full">
      <Box className="flex items-center justify-between mb-6">
        <Typography variant="h4" className="font-bold">
          Store Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreateDialog}
        >
          Add Store
        </Button>
      </Box>

      {/* Search */}
      <Paper className="p-4 mb-4">
        <Box className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TextField
            label="Search by city or state"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <Box className="flex items-center gap-2">
            <Button
              variant="outlined"
              size="small"
              onClick={() => { setPage(0); fetchStores(); }}
            >
              Search
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => { setSearchQuery(''); setPage(0); }}
            >
              Clear
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Store Table */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Address</TableCell>
              <TableCell>City</TableCell>
              <TableCell>State</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Status</TableCell>
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
            ) : stores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" className="py-8 text-[#6b5d52]">
                  No stores found
                </TableCell>
              </TableRow>
            ) : (
              stores.map((store) => (
                <TableRow key={store.id} hover>
                  <TableCell>{store.name}</TableCell>
                  <TableCell>{store.address}</TableCell>
                  <TableCell>{store.city}</TableCell>
                  <TableCell>{store.state}</TableCell>
                  <TableCell>{store.phone}</TableCell>
                  <TableCell>{store.email || '—'}</TableCell>
                  <TableCell>
                    <Chip
                      label={store.isActive ? 'Active' : 'Inactive'}
                      size="small"
                      color={store.isActive ? 'success' : 'default'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box className="flex items-center justify-center gap-1">
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => openEditDialog(store)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => { setDeleteTarget(store); setDeleteDialogOpen(true); }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {!searchQuery.trim() && (
          <TablePagination
            component="div"
            count={totalElements}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={size}
            onRowsPerPageChange={(e) => { setSize(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[10, 20, 50]}
          />
        )}
      </TableContainer>

      {/* ─── Create/Edit Store Dialog ───────────────────────────────────────── */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingStore ? 'Edit Store' : 'Add New Store'}</DialogTitle>
        <DialogContent>
          {saveError && (
            <Alert severity="error" className="mb-4" onClose={() => setSaveError('')}>
              {saveError}
            </Alert>
          )}
          <Box className="flex flex-col gap-4 mt-2">
            <TextField
              label="Store Name"
              required
              fullWidth
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              error={!!formErrors.name}
              helperText={formErrors.name}
            />
            <TextField
              label="Address"
              required
              fullWidth
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              error={!!formErrors.address}
              helperText={formErrors.address}
            />
            <Box className="grid grid-cols-2 gap-4">
              <TextField
                label="City"
                required
                fullWidth
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                error={!!formErrors.city}
                helperText={formErrors.city}
              />
              <TextField
                label="State"
                required
                fullWidth
                value={form.state}
                onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                error={!!formErrors.state}
                helperText={formErrors.state}
              />
            </Box>
            <TextField
              label="Phone"
              required
              fullWidth
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              error={!!formErrors.phone}
              helperText={formErrors.phone || 'Format: +61 2 1234 5678'}
            />
            <TextField
              label="Email"
              type="email"
              fullWidth
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              error={!!formErrors.email}
              helperText={formErrors.email}
            />
            <TextField
              label="Operating Hours"
              fullWidth
              multiline
              rows={2}
              value={form.operatingHours}
              onChange={(e) => setForm((f) => ({ ...f, operatingHours: e.target.value }))}
              placeholder="e.g. Mon-Fri: 9am-5pm, Sat: 10am-3pm"
            />
            <Box>
              <Typography variant="body2" className="mb-1">Store Image</Typography>
              <Button variant="outlined" component="label" size="small">
                Upload Image
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </Button>
              {form.imageBase64 && (
                <Box className="mt-2">
                  <img
                    src={form.imageBase64}
                    alt="Store preview"
                    style={{ maxWidth: 200, maxHeight: 120, objectFit: 'cover', borderRadius: 4 }}
                  />
                  <Button
                    size="small"
                    color="error"
                    onClick={() => setForm((f) => ({ ...f, imageBase64: '' }))}
                    className="ml-2"
                  >
                    Remove
                  </Button>
                </Box>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <CircularProgress size={20} /> : editingStore ? 'Update Store' : 'Create Store'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Delete Confirmation Dialog ─────────────────────────────────────── */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the store "{deleteTarget?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? <CircularProgress size={20} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
