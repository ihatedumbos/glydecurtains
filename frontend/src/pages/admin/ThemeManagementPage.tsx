import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  TextField,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  Snackbar,
  CircularProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
} from '@mui/material';
import {
  Palette as PaletteIcon,
  Check as CheckIcon,
  Preview as PreviewIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import axiosInstance from '@/api/axiosInstance';

// ─── Types ──────────────────────────────────────────────────────────────────

interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  borderRadius: string;
  shadowIntensity: string;
  glassmorphismOpacity: number;
  animationSpeed: string;
}

interface ThemePreset {
  id: number;
  name: string;
  config: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const defaultConfig: ThemeConfig = {
  primaryColor: '#1a1a2e',
  secondaryColor: '#16213e',
  accentColor: '#e94560',
  backgroundColor: '#0f0f1a',
  textColor: '#eaeaea',
  borderRadius: '8px',
  shadowIntensity: 'medium',
  glassmorphismOpacity: 0.15,
  animationSpeed: 'normal',
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function ThemeManagementPage() {
  const [themes, setThemes] = useState<ThemePreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Customization state
  const [editingThemeId, setEditingThemeId] = useState<number | null>(null);
  const [editConfig, setEditConfig] = useState<ThemeConfig>(defaultConfig);
  const [saving, setSaving] = useState(false);

  // Live preview state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewConfig, setPreviewConfig] = useState<ThemeConfig | null>(null);
  const [previewName, setPreviewName] = useState('');

  // ─── Fetch Themes ───────────────────────────────────────────────────────────

  const fetchThemes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/cms/themes/all');
      setThemes(res.data.data || []);
    } catch {
      setSnackbar({ open: true, message: 'Failed to load themes', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchThemes();
  }, [fetchThemes]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleActivate = async (id: number) => {
    try {
      await axiosInstance.put(`/cms/themes/${id}/activate`);
      setSnackbar({ open: true, message: 'Theme activated successfully', severity: 'success' });
      fetchThemes();
    } catch {
      setSnackbar({ open: true, message: 'Failed to activate theme', severity: 'error' });
    }
  };

  const handleEditOpen = (theme: ThemePreset) => {
    const config = parseConfig(theme.config);
    setEditConfig(config);
    setEditingThemeId(theme.id);
  };

  const handleEditClose = () => {
    setEditingThemeId(null);
    setEditConfig(defaultConfig);
  };

  const handleSaveConfig = async () => {
    if (!editingThemeId) return;
    setSaving(true);
    try {
      await axiosInstance.put(`/cms/themes/${editingThemeId}`, {
        config: JSON.stringify(editConfig),
      });
      setSnackbar({ open: true, message: 'Theme config updated', severity: 'success' });
      handleEditClose();
      fetchThemes();
    } catch {
      setSnackbar({ open: true, message: 'Failed to update theme config', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async (theme: ThemePreset) => {
    try {
      const res = await axiosInstance.get(`/cms/themes/${theme.id}/preview`);
      const data = res.data.data;
      setPreviewConfig(parseConfig(data.config));
      setPreviewName(data.name);
      setPreviewOpen(true);
    } catch {
      setSnackbar({ open: true, message: 'Failed to load preview', severity: 'error' });
    }
  };

  // ─── Utilities ────────────────────────────────────────────────────────────

  const parseConfig = (configStr: string): ThemeConfig => {
    try {
      return { ...defaultConfig, ...JSON.parse(configStr) };
    } catch {
      return defaultConfig;
    }
  };

  const getBorderRadiusNum = (val: string): number => parseInt(val.replace('px', ''), 10) || 8;

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
      <Box display="flex" alignItems="center" gap={1} mb={3}>
        <PaletteIcon fontSize="large" color="primary" />
        <Typography variant="h4" fontWeight={700}>
          Theme Management
        </Typography>
      </Box>

      {/* ─── Theme Preset Cards ──────────────────────────────────────────── */}
      <Typography variant="h6" gutterBottom>
        Available Themes
      </Typography>

      <Grid container spacing={3} mb={4}>
        {themes.map((theme) => {
          const config = parseConfig(theme.config);
          return (
            <Grid item xs={12} sm={6} md={4} key={theme.id}>
              <Card
                elevation={theme.isActive ? 8 : 2}
                sx={{
                  border: theme.isActive ? '2px solid' : '1px solid',
                  borderColor: theme.isActive ? 'primary.main' : 'divider',
                  transition: 'all 0.3s ease',
                  '&:hover': { elevation: 6, transform: 'translateY(-2px)' },
                }}
              >
                {/* Color preview strip */}
                <Box
                  sx={{
                    height: 80,
                    background: `linear-gradient(135deg, ${config.primaryColor} 0%, ${config.secondaryColor} 50%, ${config.accentColor} 100%)`,
                    borderRadius: `${config.borderRadius} ${config.borderRadius} 0 0`,
                    position: 'relative',
                  }}
                >
                  {/* Mini preview box */}
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 8,
                      right: 8,
                      width: 40,
                      height: 40,
                      backgroundColor: config.backgroundColor,
                      borderRadius: config.borderRadius,
                      border: `2px solid ${config.accentColor}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography sx={{ color: config.textColor, fontSize: 10 }}>Aa</Typography>
                  </Box>
                </Box>

                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                    <Typography variant="h6" fontWeight={600}>
                      {theme.name}
                    </Typography>
                    <Box display="flex" gap={0.5}>
                      {theme.isActive && <Chip label="Active" color="primary" size="small" />}
                      {theme.isDefault && <Chip label="Default" variant="outlined" size="small" />}
                    </Box>
                  </Box>

                  {/* Color swatches */}
                  <Box display="flex" gap={0.5} mt={1}>
                    {[config.primaryColor, config.secondaryColor, config.accentColor, config.backgroundColor, config.textColor].map(
                      (color, idx) => (
                        <Box
                          key={idx}
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            backgroundColor: color,
                            border: '1px solid rgba(0,0,0,0.2)',
                          }}
                          title={['Primary', 'Secondary', 'Accent', 'Background', 'Text'][idx]}
                        />
                      )
                    )}
                  </Box>

                  <Box mt={1}>
                    <Typography variant="caption" color="text.secondary">
                      Radius: {config.borderRadius} • Shadow: {config.shadowIntensity} • Speed: {config.animationSpeed}
                    </Typography>
                  </Box>
                </CardContent>

                <CardActions sx={{ px: 2, pb: 2 }}>
                  {!theme.isActive && (
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<CheckIcon />}
                      onClick={() => handleActivate(theme.id)}
                    >
                      Activate
                    </Button>
                  )}
                  <Button size="small" variant="outlined" startIcon={<PreviewIcon />} onClick={() => handlePreview(theme)}>
                    Preview
                  </Button>
                  <Button size="small" startIcon={<EditIcon />} onClick={() => handleEditOpen(theme)}>
                    Customize
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* ─── Theme Customization Form ────────────────────────────────────── */}
      {editingThemeId !== null && (
        <>
          <Divider sx={{ my: 3 }} />
          <Paper sx={{ p: 3 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="h6" fontWeight={600}>
                Customize Theme
              </Typography>
              <Button startIcon={<CloseIcon />} onClick={handleEditClose}>
                Cancel
              </Button>
            </Box>

            <Grid container spacing={3}>
              {/* Colors */}
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Primary Color"
                  type="color"
                  fullWidth
                  value={editConfig.primaryColor}
                  onChange={(e) => setEditConfig((c) => ({ ...c, primaryColor: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Secondary Color"
                  type="color"
                  fullWidth
                  value={editConfig.secondaryColor}
                  onChange={(e) => setEditConfig((c) => ({ ...c, secondaryColor: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Accent Color"
                  type="color"
                  fullWidth
                  value={editConfig.accentColor}
                  onChange={(e) => setEditConfig((c) => ({ ...c, accentColor: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Background Color"
                  type="color"
                  fullWidth
                  value={editConfig.backgroundColor}
                  onChange={(e) => setEditConfig((c) => ({ ...c, backgroundColor: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  label="Text Color"
                  type="color"
                  fullWidth
                  value={editConfig.textColor}
                  onChange={(e) => setEditConfig((c) => ({ ...c, textColor: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              {/* Border Radius */}
              <Grid item xs={12} sm={6} md={4}>
                <Typography gutterBottom>Border Radius: {editConfig.borderRadius}</Typography>
                <Slider
                  value={getBorderRadiusNum(editConfig.borderRadius)}
                  min={0}
                  max={24}
                  step={1}
                  onChange={(_, val) => setEditConfig((c) => ({ ...c, borderRadius: `${val}px` }))}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(v) => `${v}px`}
                />
              </Grid>

              {/* Shadow Intensity */}
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Shadow Intensity</InputLabel>
                  <Select
                    label="Shadow Intensity"
                    value={editConfig.shadowIntensity}
                    onChange={(e) => setEditConfig((c) => ({ ...c, shadowIntensity: e.target.value }))}
                  >
                    <MenuItem value="none">None</MenuItem>
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Glassmorphism Opacity */}
              <Grid item xs={12} sm={6} md={4}>
                <Typography gutterBottom>
                  Glassmorphism Opacity: {(editConfig.glassmorphismOpacity * 100).toFixed(0)}%
                </Typography>
                <Slider
                  value={editConfig.glassmorphismOpacity}
                  min={0}
                  max={0.5}
                  step={0.01}
                  onChange={(_, val) =>
                    setEditConfig((c) => ({ ...c, glassmorphismOpacity: val as number }))
                  }
                  valueLabelDisplay="auto"
                  valueLabelFormat={(v) => `${(v * 100).toFixed(0)}%`}
                />
              </Grid>

              {/* Animation Speed */}
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Animation Speed</InputLabel>
                  <Select
                    label="Animation Speed"
                    value={editConfig.animationSpeed}
                    onChange={(e) => setEditConfig((c) => ({ ...c, animationSpeed: e.target.value }))}
                  >
                    <MenuItem value="slow">Slow</MenuItem>
                    <MenuItem value="normal">Normal</MenuItem>
                    <MenuItem value="fast">Fast</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Live preview swatch */}
            <Box mt={3}>
              <Typography variant="subtitle2" gutterBottom>
                Live Preview
              </Typography>
              <Box
                sx={{
                  p: 3,
                  borderRadius: editConfig.borderRadius,
                  background: editConfig.backgroundColor,
                  border: `1px solid ${editConfig.accentColor}`,
                  boxShadow:
                    editConfig.shadowIntensity === 'high'
                      ? '0 8px 32px rgba(0,0,0,0.4)'
                      : editConfig.shadowIntensity === 'medium'
                      ? '0 4px 16px rgba(0,0,0,0.25)'
                      : editConfig.shadowIntensity === 'low'
                      ? '0 2px 8px rgba(0,0,0,0.15)'
                      : 'none',
                  backdropFilter: `blur(${editConfig.glassmorphismOpacity * 40}px)`,
                  transition: `all ${editConfig.animationSpeed === 'fast' ? '0.15s' : editConfig.animationSpeed === 'slow' ? '0.6s' : '0.3s'} ease`,
                }}
              >
                <Typography sx={{ color: editConfig.textColor, mb: 1 }} variant="h6">
                  Sample Heading
                </Typography>
                <Typography sx={{ color: editConfig.textColor, opacity: 0.8 }} variant="body2">
                  This preview demonstrates how the theme will look with your selected colors, border radius, and effects.
                </Typography>
                <Box mt={2} display="flex" gap={1}>
                  <Button
                    variant="contained"
                    size="small"
                    sx={{ backgroundColor: editConfig.accentColor, borderRadius: editConfig.borderRadius }}
                  >
                    Primary Action
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    sx={{ borderColor: editConfig.accentColor, color: editConfig.accentColor, borderRadius: editConfig.borderRadius }}
                  >
                    Secondary
                  </Button>
                </Box>
              </Box>
            </Box>

            <Box mt={3} display="flex" justifyContent="flex-end">
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSaveConfig}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </Paper>
        </>
      )}

      {/* ─── Preview Dialog ──────────────────────────────────────────────── */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Theme Preview: {previewName}</DialogTitle>
        <DialogContent>
          {previewConfig && (
            <Box
              sx={{
                p: 3,
                mt: 1,
                borderRadius: previewConfig.borderRadius,
                background: previewConfig.backgroundColor,
                border: `1px solid ${previewConfig.accentColor}`,
                boxShadow:
                  previewConfig.shadowIntensity === 'high'
                    ? '0 8px 32px rgba(0,0,0,0.4)'
                    : previewConfig.shadowIntensity === 'medium'
                    ? '0 4px 16px rgba(0,0,0,0.25)'
                    : previewConfig.shadowIntensity === 'low'
                    ? '0 2px 8px rgba(0,0,0,0.15)'
                    : 'none',
                backdropFilter: `blur(${previewConfig.glassmorphismOpacity * 40}px)`,
              }}
            >
              <Typography sx={{ color: previewConfig.textColor, mb: 1 }} variant="h5">
                {previewName}
              </Typography>
              <Typography sx={{ color: previewConfig.textColor, opacity: 0.8 }} variant="body1">
                Preview of how the storefront will look with this theme applied.
              </Typography>

              {/* Navigation sample */}
              <Box
                mt={2}
                p={1.5}
                sx={{
                  backgroundColor: previewConfig.primaryColor,
                  borderRadius: previewConfig.borderRadius,
                }}
              >
                <Box display="flex" gap={2}>
                  {['Home', 'Products', 'About', 'Contact'].map((item) => (
                    <Typography key={item} sx={{ color: previewConfig.textColor, fontSize: 13 }}>
                      {item}
                    </Typography>
                  ))}
                </Box>
              </Box>

              {/* Card sample */}
              <Box
                mt={2}
                p={2}
                sx={{
                  backgroundColor: previewConfig.secondaryColor,
                  borderRadius: previewConfig.borderRadius,
                  border: `1px solid ${previewConfig.accentColor}30`,
                }}
              >
                <Typography sx={{ color: previewConfig.textColor }} variant="subtitle1" fontWeight={600}>
                  Sample Product Card
                </Typography>
                <Typography sx={{ color: previewConfig.textColor, opacity: 0.7 }} variant="body2">
                  Premium Blackout Curtains
                </Typography>
                <Button
                  size="small"
                  sx={{
                    mt: 1,
                    backgroundColor: previewConfig.accentColor,
                    color: '#fff',
                    borderRadius: previewConfig.borderRadius,
                    '&:hover': { backgroundColor: previewConfig.accentColor, opacity: 0.9 },
                  }}
                >
                  Add to Cart
                </Button>
              </Box>

              {/* Color palette */}
              <Box display="flex" gap={1} mt={2}>
                {[
                  { color: previewConfig.primaryColor, label: 'Primary' },
                  { color: previewConfig.secondaryColor, label: 'Secondary' },
                  { color: previewConfig.accentColor, label: 'Accent' },
                  { color: previewConfig.backgroundColor, label: 'Background' },
                  { color: previewConfig.textColor, label: 'Text' },
                ].map(({ color, label }) => (
                  <Box key={label} textAlign="center">
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        backgroundColor: color,
                        border: '2px solid rgba(255,255,255,0.2)',
                        mx: 'auto',
                      }}
                    />
                    <Typography sx={{ color: previewConfig.textColor, fontSize: 10, mt: 0.5 }}>
                      {label}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
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
