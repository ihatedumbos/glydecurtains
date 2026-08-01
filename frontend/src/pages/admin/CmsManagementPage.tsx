import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  CircularProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  IconButton,
  Grid,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  ExpandMore as ExpandMoreIcon,
  Web as WebIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import axiosInstance from '@/api/axiosInstance';

// ─── Types ──────────────────────────────────────────────────────────────────

type SectionType =
  | 'HERO_BANNER' | 'PROMO_BANNER' | 'FEATURED' | 'LATEST' | 'NEW_ARRIVALS'
  | 'POPULAR_CATEGORIES' | 'PREMIUM_COLLECTIONS' | 'SEASONAL' | 'BEST_SELLING'
  | 'RECOMMENDED' | 'FEATURED_ACCESSORIES' | 'TRENDING' | 'RECENTLY_ADDED'
  | 'TESTIMONIALS' | 'BRAND_STORY' | 'ACHIEVEMENTS' | 'NEWSLETTER' | 'FOOTER'
  | 'SCROLLING_TICKER';

interface Banner {
  id: number;
  sectionId: number;
  title: string;
  subtitle: string;
  imageBase64: string;
  buttonText: string;
  buttonLink: string;
  sortOrder: number;
  isActive: boolean;
  translations: Record<string, Record<string, string>> | null;
  createdAt: string;
  updatedAt: string;
}

interface HomepageSection {
  id: number;
  sectionType: SectionType;
  title: string;
  isEnabled: boolean;
  sortOrder: number;
  config: string | null;
  banners: Banner[] | null;
  translations: Record<string, Record<string, string>> | null;
  createdAt: string;
  updatedAt: string;
}

interface SectionConfig {
  contentSource?: string;
  tickerSpeed?: number;
  tickerContent?: string;
  visibility?: string;
}

interface BannerForm {
  title: string;
  subtitle: string;
  imageBase64: string;
  buttonText: string;
  buttonLink: string;
  translations: Record<string, Record<string, string>>;
}

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'gu', label: 'Gujarati' },
];

const BANNER_FIELDS = ['title', 'subtitle', 'buttonText'];

const SECTION_TYPE_LABELS: Record<SectionType, string> = {
  HERO_BANNER: 'Hero Banner',
  PROMO_BANNER: 'Promotional Banner',
  FEATURED: 'Featured Products',
  LATEST: 'Latest Products',
  NEW_ARRIVALS: 'New Arrivals',
  POPULAR_CATEGORIES: 'Popular Categories',
  PREMIUM_COLLECTIONS: 'Premium Collections',
  SEASONAL: 'Seasonal',
  BEST_SELLING: 'Best Selling',
  RECOMMENDED: 'Recommended',
  FEATURED_ACCESSORIES: 'Featured Accessories',
  TRENDING: 'Trending',
  RECENTLY_ADDED: 'Recently Added',
  TESTIMONIALS: 'Testimonials',
  BRAND_STORY: 'Brand Story',
  ACHIEVEMENTS: 'Achievements',
  NEWSLETTER: 'Newsletter',
  FOOTER: 'Footer',
  SCROLLING_TICKER: 'Scrolling Ticker',
};

const emptyBannerForm: BannerForm = {
  title: '',
  subtitle: '',
  imageBase64: '',
  buttonText: '',
  buttonLink: '',
  translations: {},
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function CmsManagementPage() {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  // Banner dialog state
  const [bannerDialogOpen, setBannerDialogOpen] = useState(false);
  const [bannerForm, setBannerForm] = useState<BannerForm>(emptyBannerForm);
  const [editingBannerId, setEditingBannerId] = useState<number | null>(null);
  const [bannerSectionId, setBannerSectionId] = useState<number | null>(null);
  const [bannerSaving, setBannerSaving] = useState(false);
  const [bannerLangTab, setBannerLangTab] = useState(0);

  // Section config dialog state
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [configSection, setConfigSection] = useState<HomepageSection | null>(null);
  const [configForm, setConfigForm] = useState<SectionConfig>({});
  const [configTitle, setConfigTitle] = useState('');
  const [configTranslations, setConfigTranslations] = useState<Record<string, Record<string, string>>>({});
  const [configLangTab, setConfigLangTab] = useState(0);
  const [configSaving, setConfigSaving] = useState(false);

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteBannerTarget, setDeleteBannerTarget] = useState<Banner | null>(null);

  // Drag state
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // ─── Fetch Sections ─────────────────────────────────────────────────────

  const fetchSections = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/cms/sections');
      setSections(res.data.data || []);
    } catch {
      setSnackbar({ open: true, message: 'Failed to load sections', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  // ─── Toggle Section Enabled ─────────────────────────────────────────────

  const handleToggleSection = async (section: HomepageSection) => {
    try {
      await axiosInstance.put(`/cms/sections/${section.id}`, {
        isEnabled: !section.isEnabled,
      });
      setSections((prev) =>
        prev.map((s) => (s.id === section.id ? { ...s, isEnabled: !s.isEnabled } : s))
      );
      setSnackbar({
        open: true,
        message: `Section ${!section.isEnabled ? 'enabled' : 'disabled'}`,
        severity: 'success',
      });
    } catch {
      setSnackbar({ open: true, message: 'Failed to toggle section', severity: 'error' });
    }
  };

  // ─── Drag-to-Reorder Sections ───────────────────────────────────────────

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

    const reordered = [...sections];
    const [draggedItem] = reordered.splice(dragItem.current, 1);
    reordered.splice(dragOverItem.current, 0, draggedItem);
    setSections(reordered);

    dragItem.current = null;
    dragOverItem.current = null;

    const orders = reordered.map((item, index) => ({
      id: item.id,
      sortOrder: index + 1,
    }));

    try {
      await axiosInstance.put('/cms/sections/reorder', orders);
      setSnackbar({ open: true, message: 'Section order updated', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Failed to update order', severity: 'error' });
      fetchSections();
    }
  };

  // ─── Section Config Editor ──────────────────────────────────────────────

  const handleOpenConfig = (section: HomepageSection) => {
    setConfigSection(section);
    setConfigTitle(section.title || '');
    const parsed: SectionConfig = section.config ? JSON.parse(section.config) : {};
    setConfigForm(parsed);
    setConfigTranslations(section.translations || {});
    setConfigLangTab(0);
    setConfigDialogOpen(true);
  };

  const handleSaveConfig = async () => {
    if (!configSection) return;
    setConfigSaving(true);
    try {
      await axiosInstance.put(`/cms/sections/${configSection.id}`, {
        title: configTitle,
        config: JSON.stringify(configForm),
        translations: configTranslations,
      });
      setSnackbar({ open: true, message: 'Section updated', severity: 'success' });
      setConfigDialogOpen(false);
      fetchSections();
    } catch {
      setSnackbar({ open: true, message: 'Failed to update section', severity: 'error' });
    } finally {
      setConfigSaving(false);
    }
  };

  // ─── Banner CRUD ────────────────────────────────────────────────────────

  const handleOpenCreateBanner = (sectionId: number) => {
    setBannerForm(emptyBannerForm);
    setEditingBannerId(null);
    setBannerSectionId(sectionId);
    setBannerLangTab(0);
    setBannerDialogOpen(true);
  };

  const handleOpenEditBanner = (banner: Banner) => {
    setBannerForm({
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      imageBase64: banner.imageBase64 || '',
      buttonText: banner.buttonText || '',
      buttonLink: banner.buttonLink || '',
      translations: banner.translations || {},
    });
    setEditingBannerId(banner.id);
    setBannerSectionId(banner.sectionId);
    setBannerLangTab(0);
    setBannerDialogOpen(true);
  };

  const handleCloseBannerDialog = () => {
    setBannerDialogOpen(false);
    setEditingBannerId(null);
    setBannerForm(emptyBannerForm);
  };

  const handleBannerImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setBannerForm((f) => ({ ...f, imageBase64: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBanner = async () => {
    if (!bannerForm.imageBase64) return;
    setBannerSaving(true);
    try {
      if (editingBannerId) {
        await axiosInstance.put(`/cms/banners/${editingBannerId}`, {
          title: bannerForm.title || null,
          subtitle: bannerForm.subtitle || null,
          imageBase64: bannerForm.imageBase64,
          buttonText: bannerForm.buttonText || null,
          buttonLink: bannerForm.buttonLink || null,
          translations: Object.keys(bannerForm.translations).length > 0 ? bannerForm.translations : null,
        });
        setSnackbar({ open: true, message: 'Banner updated', severity: 'success' });
      } else {
        await axiosInstance.post('/cms/banners', {
          sectionId: bannerSectionId,
          title: bannerForm.title || null,
          subtitle: bannerForm.subtitle || null,
          imageBase64: bannerForm.imageBase64,
          buttonText: bannerForm.buttonText || null,
          buttonLink: bannerForm.buttonLink || null,
          translations: Object.keys(bannerForm.translations).length > 0 ? bannerForm.translations : null,
        });
        setSnackbar({ open: true, message: 'Banner created', severity: 'success' });
      }
      handleCloseBannerDialog();
      fetchSections();
    } catch {
      setSnackbar({ open: true, message: 'Failed to save banner', severity: 'error' });
    } finally {
      setBannerSaving(false);
    }
  };

  const handleDeleteBannerConfirm = (banner: Banner) => {
    setDeleteBannerTarget(banner);
    setDeleteDialogOpen(true);
  };

  const handleDeleteBanner = async () => {
    if (!deleteBannerTarget) return;
    try {
      await axiosInstance.delete(`/cms/banners/${deleteBannerTarget.id}`);
      setSnackbar({ open: true, message: 'Banner deleted', severity: 'success' });
      setDeleteDialogOpen(false);
      setDeleteBannerTarget(null);
      fetchSections();
    } catch {
      setSnackbar({ open: true, message: 'Failed to delete banner', severity: 'error' });
    }
  };

  // ─── Translation Helpers ────────────────────────────────────────────────

  const updateBannerTranslation = (lang: string, field: string, value: string) => {
    setBannerForm((f) => ({
      ...f,
      translations: {
        ...f.translations,
        [lang]: { ...(f.translations[lang] || {}), [field]: value },
      },
    }));
  };

  const updateConfigTranslation = (lang: string, field: string, value: string) => {
    setConfigTranslations((t) => ({
      ...t,
      [lang]: { ...(t[lang] || {}), [field]: value },
    }));
  };

  // ─── Helpers ────────────────────────────────────────────────────────────

  const isBannerSection = (type: SectionType) =>
    type === 'HERO_BANNER' || type === 'PROMO_BANNER';

  const isTickerSection = (type: SectionType) =>
    type === 'SCROLLING_TICKER';

  // ─── Render ─────────────────────────────────────────────────────────────

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
          <WebIcon fontSize="large" color="primary" />
          <Typography variant="h4" fontWeight={700}>
            Homepage Management
          </Typography>
        </Box>
      </Box>

      <Typography variant="body2" color="text.secondary" mb={3}>
        Drag sections to reorder. Toggle visibility, edit configuration, and manage banners for each section.
      </Typography>

      {/* Sections List */}
      {sections.map((section, index) => (
        <Paper
          key={section.id}
          sx={{ mb: 2, overflow: 'hidden', opacity: section.isEnabled ? 1 : 0.7 }}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragEnter={() => handleDragEnter(index)}
          onDragEnd={handleDragEnd}
          onDragOver={(e) => e.preventDefault()}
        >
          <Box
            display="flex"
            alignItems="center"
            px={2}
            py={1.5}
            sx={{ cursor: 'grab', '&:hover': { bgcolor: 'action.hover' } }}
          >
            <DragIcon color="action" sx={{ mr: 1, cursor: 'grab' }} />
            <Chip
              label={SECTION_TYPE_LABELS[section.sectionType] || section.sectionType}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ mr: 2 }}
            />
            <Typography fontWeight={600} sx={{ flex: 1 }}>
              {section.title || SECTION_TYPE_LABELS[section.sectionType]}
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={section.isEnabled}
                  onChange={() => handleToggleSection(section)}
                  size="small"
                />
              }
              label={section.isEnabled ? 'Visible' : 'Hidden'}
              sx={{ mr: 1 }}
            />
            <IconButton size="small" onClick={() => handleOpenConfig(section)} title="Edit configuration">
              <EditIcon fontSize="small" />
            </IconButton>
            {isBannerSection(section.sectionType) && (
              <IconButton
                size="small"
                color="primary"
                onClick={() => handleOpenCreateBanner(section.id)}
                title="Add banner"
              >
                <AddIcon fontSize="small" />
              </IconButton>
            )}
          </Box>

          {/* Banner cards for HERO_BANNER / PROMO_BANNER */}
          {isBannerSection(section.sectionType) && section.banners && section.banners.length > 0 && (
            <Box px={2} pb={2}>
              <Divider sx={{ mb: 1.5 }} />
              <Grid container spacing={2}>
                {section.banners.map((banner) => (
                  <Grid item xs={12} sm={6} md={4} key={banner.id}>
                    <Card variant="outlined">
                      {banner.imageBase64 && (
                        <CardMedia
                          component="img"
                          height="120"
                          image={banner.imageBase64}
                          alt={banner.title || 'Banner'}
                          sx={{ objectFit: 'cover' }}
                        />
                      )}
                      <CardContent sx={{ pb: 1 }}>
                        <Typography fontWeight={600} noWrap>
                          {banner.title || '(Untitled)'}
                        </Typography>
                        {banner.subtitle && (
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {banner.subtitle}
                          </Typography>
                        )}
                        <Box mt={0.5}>
                          <Chip
                            size="small"
                            icon={banner.isActive ? <VisibilityIcon /> : <VisibilityOffIcon />}
                            label={banner.isActive ? 'Active' : 'Inactive'}
                            color={banner.isActive ? 'success' : 'default'}
                            variant="outlined"
                          />
                        </Box>
                      </CardContent>
                      <CardActions>
                        <IconButton size="small" onClick={() => handleOpenEditBanner(banner)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDeleteBannerConfirm(banner)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Ticker config summary */}
          {isTickerSection(section.sectionType) && section.config && (
            <Box px={2} pb={2}>
              <Divider sx={{ mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Speed: {JSON.parse(section.config).tickerSpeed || 50}% | Content: {JSON.parse(section.config).tickerContent || '(not set)'}
              </Typography>
            </Box>
          )}
        </Paper>
      ))}

      {sections.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">No homepage sections found.</Typography>
        </Paper>
      )}

      {/* ─── Section Config Dialog ─────────────────────────────────────────── */}
      <Dialog open={configDialogOpen} onClose={() => setConfigDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Edit Section: {configSection ? (SECTION_TYPE_LABELS[configSection.sectionType] || configSection.sectionType) : ''}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                label="Title"
                fullWidth
                value={configTitle}
                onChange={(e) => setConfigTitle(e.target.value)}
              />
            </Grid>

            {/* Content source */}
            <Grid item xs={12}>
              <TextField
                label="Content Source"
                fullWidth
                value={configForm.contentSource || ''}
                onChange={(e) => setConfigForm((f) => ({ ...f, contentSource: e.target.value }))}
                placeholder="e.g. latest, featured, manual"
                helperText="How this section sources its content"
              />
            </Grid>

            {/* Visibility */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Visibility</InputLabel>
                <Select
                  label="Visibility"
                  value={configForm.visibility || 'all'}
                  onChange={(e) => setConfigForm((f) => ({ ...f, visibility: e.target.value }))}
                >
                  <MenuItem value="all">All Users</MenuItem>
                  <MenuItem value="logged_in">Logged In Only</MenuItem>
                  <MenuItem value="guests">Guests Only</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Ticker-specific settings */}
            {configSection && isTickerSection(configSection.sectionType) && (
              <>
                <Grid item xs={12}>
                  <Typography gutterBottom>Ticker Speed</Typography>
                  <Slider
                    value={configForm.tickerSpeed || 50}
                    onChange={(_, v) => setConfigForm((f) => ({ ...f, tickerSpeed: v as number }))}
                    min={10}
                    max={100}
                    step={5}
                    valueLabelDisplay="auto"
                    marks={[
                      { value: 10, label: 'Slow' },
                      { value: 50, label: 'Medium' },
                      { value: 100, label: 'Fast' },
                    ]}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Ticker Content"
                    fullWidth
                    multiline
                    rows={3}
                    value={configForm.tickerContent || ''}
                    onChange={(e) => setConfigForm((f) => ({ ...f, tickerContent: e.target.value }))}
                    placeholder="Pipe-separated messages: msg1 | msg2 | msg3"
                    helperText="Separate multiple messages with | character"
                  />
                </Grid>
              </>
            )}

            {/* Multi-language tabs for section */}
            <Grid item xs={12}>
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle2">Translations</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Tabs
                    value={configLangTab}
                    onChange={(_, v) => setConfigLangTab(v)}
                    sx={{ mb: 2 }}
                  >
                    {LANGUAGES.filter((l) => l.code !== 'en').map((lang) => (
                      <Tab key={lang.code} label={lang.label} />
                    ))}
                  </Tabs>
                  {LANGUAGES.filter((l) => l.code !== 'en').map((lang, idx) => (
                    <Box key={lang.code} hidden={configLangTab !== idx}>
                      <TextField
                        label={`Title (${lang.label})`}
                        fullWidth
                        size="small"
                        value={configTranslations[lang.code]?.title || ''}
                        onChange={(e) => updateConfigTranslation(lang.code, 'title', e.target.value)}
                        sx={{ mb: 1 }}
                      />
                    </Box>
                  ))}
                </AccordionDetails>
              </Accordion>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfigDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveConfig} disabled={configSaving}>
            {configSaving ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Banner CRUD Dialog ────────────────────────────────────────────── */}
      <Dialog open={bannerDialogOpen} onClose={handleCloseBannerDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingBannerId ? 'Edit Banner' : 'Add Banner'}</DialogTitle>
        <DialogContent>
          <Tabs value={bannerLangTab} onChange={(_, v) => setBannerLangTab(v)} sx={{ mb: 2 }}>
            <Tab label="Content (English)" />
            {LANGUAGES.filter((l) => l.code !== 'en').map((lang) => (
              <Tab key={lang.code} label={lang.label} />
            ))}
          </Tabs>

          {/* English content tab */}
          <Box hidden={bannerLangTab !== 0}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Title"
                  fullWidth
                  value={bannerForm.title}
                  onChange={(e) => setBannerForm((f) => ({ ...f, title: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Subtitle"
                  fullWidth
                  value={bannerForm.subtitle}
                  onChange={(e) => setBannerForm((f) => ({ ...f, subtitle: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Button Text"
                  fullWidth
                  value={bannerForm.buttonText}
                  onChange={(e) => setBannerForm((f) => ({ ...f, buttonText: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Button Link"
                  fullWidth
                  value={bannerForm.buttonLink}
                  onChange={(e) => setBannerForm((f) => ({ ...f, buttonLink: e.target.value }))}
                  placeholder="/products"
                />
              </Grid>

              {/* Media picker */}
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Banner Image / Video *
                </Typography>
                <Button variant="outlined" component="label" startIcon={<ImageIcon />}>
                  Choose File
                  <input
                    type="file"
                    hidden
                    accept="image/*,video/mp4,video/webm"
                    onChange={handleBannerImageUpload}
                  />
                </Button>
                {bannerForm.imageBase64 && (
                  <Box mt={1.5}>
                    {bannerForm.imageBase64.startsWith('data:video') ? (
                      <Box
                        component="video"
                        src={bannerForm.imageBase64}
                        sx={{ width: '100%', maxHeight: 200, borderRadius: 1, border: '1px solid', borderColor: 'divider' }}
                        controls
                      />
                    ) : (
                      <Box
                        component="img"
                        src={bannerForm.imageBase64}
                        alt="Preview"
                        sx={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}
                      />
                    )}
                    <Button
                      size="small"
                      color="error"
                      onClick={() => setBannerForm((f) => ({ ...f, imageBase64: '' }))}
                      sx={{ mt: 0.5 }}
                    >
                      Remove
                    </Button>
                  </Box>
                )}
              </Grid>
            </Grid>
          </Box>

          {/* Translation tabs */}
          {LANGUAGES.filter((l) => l.code !== 'en').map((lang, idx) => (
            <Box key={lang.code} hidden={bannerLangTab !== idx + 1}>
              <Grid container spacing={2}>
                {BANNER_FIELDS.map((field) => (
                  <Grid item xs={12} sm={6} key={field}>
                    <TextField
                      label={`${field.charAt(0).toUpperCase() + field.slice(1)} (${lang.label})`}
                      fullWidth
                      value={bannerForm.translations[lang.code]?.[field] || ''}
                      onChange={(e) => updateBannerTranslation(lang.code, field, e.target.value)}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseBannerDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveBanner}
            disabled={bannerSaving || !bannerForm.imageBase64}
          >
            {bannerSaving ? 'Saving...' : editingBannerId ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Delete Banner Confirmation ────────────────────────────────────── */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Banner</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete &quot;{deleteBannerTarget?.title || 'this banner'}&quot;? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteBanner}>
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
