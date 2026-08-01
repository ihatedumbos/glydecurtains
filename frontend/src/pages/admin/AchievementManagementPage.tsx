import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  CircularProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material';
import axiosInstance from '@/api/axiosInstance';

// ─── Types ──────────────────────────────────────────────────────────────────

type MetricFormat = 'NUMERIC_SUFFIX' | 'PLAIN_TEXT' | 'PERCENTAGE';

interface Achievement {
  id: number;
  title: string;
  description: string;
  iconBase64: string | null;
  year: number | null;
  metricValue: string;
  metricFormat: MetricFormat;
  sortOrder: number;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AchievementForm {
  title: string;
  description: string;
  iconBase64: string;
  year: string;
  metricValue: string;
  metricFormat: MetricFormat;
}

const emptyForm: AchievementForm = {
  title: '',
  description: '',
  iconBase64: '',
  year: '',
  metricValue: '',
  metricFormat: 'NUMERIC_SUFFIX',
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function AchievementManagementPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // CRUD dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<AchievementForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Achievement | null>(null);

  // Drag state
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // ─── Fetch Achievements ─────────────────────────────────────────────────

  const fetchAchievements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/achievements');
      setAchievements(res.data.data || []);
    } catch {
      setSnackbar({ open: true, message: 'Failed to load achievements', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  // ─── CRUD Handlers ────────────────────────────────────────────────────────

  const handleOpenCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setDialogOpen(true);
  };

  const handleOpenEdit = (achievement: Achievement) => {
    setForm({
      title: achievement.title,
      description: achievement.description || '',
      iconBase64: achievement.iconBase64 || '',
      year: achievement.year?.toString() || '',
      metricValue: achievement.metricValue || '',
      metricFormat: achievement.metricFormat || 'NUMERIC_SUFFIX',
    });
    setEditingId(achievement.id);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description || null,
        iconBase64: form.iconBase64 || null,
        year: form.year ? parseInt(form.year, 10) : null,
        metricValue: form.metricValue || null,
        metricFormat: form.metricFormat,
      };

      if (editingId) {
        await axiosInstance.put(`/achievements/${editingId}`, payload);
        setSnackbar({ open: true, message: 'Achievement updated successfully', severity: 'success' });
      } else {
        await axiosInstance.post('/achievements', payload);
        setSnackbar({ open: true, message: 'Achievement created successfully', severity: 'success' });
      }
      handleCloseDialog();
      fetchAchievements();
    } catch {
      setSnackbar({ open: true, message: 'Failed to save achievement', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirm = (achievement: Achievement) => {
    setDeleteTarget(achievement);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await axiosInstance.delete(`/achievements/${deleteTarget.id}`);
      setSnackbar({ open: true, message: 'Achievement deleted', severity: 'success' });
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      fetchAchievements();
    } catch {
      setSnackbar({ open: true, message: 'Failed to delete achievement', severity: 'error' });
    }
  };

  // ─── Toggle Enabled ───────────────────────────────────────────────────────

  const handleToggle = async (achievement: Achievement) => {
    try {
      await axiosInstance.put(`/achievements/${achievement.id}/toggle`, {
        enabled: !achievement.isEnabled,
      });
      setAchievements((prev) =>
        prev.map((a) => (a.id === achievement.id ? { ...a, isEnabled: !a.isEnabled } : a))
      );
      setSnackbar({
        open: true,
        message: `Achievement ${!achievement.isEnabled ? 'enabled' : 'disabled'}`,
        severity: 'success',
      });
    } catch {
      setSnackbar({ open: true, message: 'Failed to toggle achievement', severity: 'error' });
    }
  };

  // ─── Drag-to-Reorder ─────────────────────────────────────────────────────

  const handleDragStart = (index: number) => {
    dragItem.current = index;
  };

  const handleDragEnter = (index: number) => {
    dragOverItem.current = index;
  };

  const handleDragEnd = async () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    if (dragItem.current === dragOverItem.current) {
      dragItem.current = null;
      dragOverItem.current = null;
      return;
    }

    const reordered = [...achievements];
    const [draggedItem] = reordered.splice(dragItem.current, 1);
    reordered.splice(dragOverItem.current, 0, draggedItem);

    // Update local state immediately for responsiveness
    setAchievements(reordered);

    dragItem.current = null;
    dragOverItem.current = null;

    // Persist new order
    const orders = reordered.map((item, index) => ({
      id: item.id,
      sortOrder: index + 1,
    }));

    try {
      await axiosInstance.put('/achievements/reorder', orders);
      setSnackbar({ open: true, message: 'Order updated', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Failed to update order', severity: 'error' });
      fetchAchievements(); // revert on failure
    }
  };

  // ─── Icon Upload ──────────────────────────────────────────────────────────

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setForm((prev) => ({ ...prev, iconBase64: base64 }));
    };
    reader.readAsDataURL(file);
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <TrophyIcon fontSize="large" color="primary" />
          <Typography variant="h4" fontWeight={700}>
            Achievement Management
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreate}>
          Add Achievement
        </Button>
      </Box>

      {/* Achievement List Table with Drag-to-Reorder */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width={50} />
              <TableCell>Title</TableCell>
              <TableCell>Metric</TableCell>
              <TableCell>Year</TableCell>
              <TableCell>Format</TableCell>
              <TableCell align="center">Enabled</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {achievements.map((achievement, index) => (
              <TableRow
                key={achievement.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragEnter={() => handleDragEnter(index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => e.preventDefault()}
                sx={{
                  cursor: 'grab',
                  '&:hover': { backgroundColor: 'action.hover' },
                  opacity: achievement.isEnabled ? 1 : 0.6,
                }}
              >
                <TableCell>
                  <DragIcon color="action" sx={{ cursor: 'grab' }} />
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center" gap={1}>
                    {achievement.iconBase64 && (
                      <Box
                        component="img"
                        src={achievement.iconBase64}
                        alt=""
                        sx={{ width: 28, height: 28, borderRadius: 1, objectFit: 'contain' }}
                      />
                    )}
                    <Box>
                      <Typography fontWeight={600}>{achievement.title}</Typography>
                      {achievement.description && (
                        <Typography variant="caption" color="text.secondary">
                          {achievement.description}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>{achievement.metricValue || '—'}</TableCell>
                <TableCell>{achievement.year || '—'}</TableCell>
                <TableCell>{achievement.metricFormat?.replace('_', ' ') || '—'}</TableCell>
                <TableCell align="center">
                  <Switch
                    checked={achievement.isEnabled}
                    onChange={() => handleToggle(achievement)}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => handleOpenEdit(achievement)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDeleteConfirm(achievement)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {achievements.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">No achievements found. Click "Add Achievement" to create one.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ─── CRUD Dialog ───────────────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit Achievement' : 'Create Achievement'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                label="Title"
                fullWidth
                required
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                inputProps={{ maxLength: 100 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                inputProps={{ maxLength: 500 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Year"
                type="number"
                fullWidth
                value={form.year}
                onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
                inputProps={{ min: 1900, max: 2100 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Metric Value"
                fullWidth
                value={form.metricValue}
                onChange={(e) => setForm((f) => ({ ...f, metricValue: e.target.value }))}
                placeholder="e.g. 10000+"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Metric Format</InputLabel>
                <Select
                  label="Metric Format"
                  value={form.metricFormat}
                  onChange={(e) => setForm((f) => ({ ...f, metricFormat: e.target.value as MetricFormat }))}
                >
                  <MenuItem value="NUMERIC_SUFFIX">Numeric Suffix</MenuItem>
                  <MenuItem value="PLAIN_TEXT">Plain Text</MenuItem>
                  <MenuItem value="PERCENTAGE">Percentage</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Icon Upload
                </Typography>
                <Button variant="outlined" component="label" size="small">
                  Choose File
                  <input type="file" hidden accept="image/*" onChange={handleIconUpload} />
                </Button>
                {form.iconBase64 && (
                  <Box mt={1} display="flex" alignItems="center" gap={1}>
                    <Box
                      component="img"
                      src={form.iconBase64}
                      alt="Icon preview"
                      sx={{ width: 40, height: 40, borderRadius: 1, objectFit: 'contain', border: '1px solid', borderColor: 'divider' }}
                    />
                    <Button size="small" color="error" onClick={() => setForm((f) => ({ ...f, iconBase64: '' }))}>
                      Remove
                    </Button>
                  </Box>
                )}
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || !form.title.trim()}>
            {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Delete Confirmation Dialog ────────────────────────────────────── */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Achievement</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{deleteTarget?.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Snackbar ──────────────────────────────────────────────────────── */}
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
