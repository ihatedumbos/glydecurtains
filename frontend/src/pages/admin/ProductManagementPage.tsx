import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, TextField, Select, MenuItem, FormControl, InputLabel,
  Button, IconButton, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, TablePagination, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, CircularProgress, Tooltip, InputAdornment, Tabs, Tab,
  FormControlLabel, Checkbox, Grid, Divider, Alert, SelectChangeEvent,
} from '@mui/material';
import {
  Search as SearchIcon, Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Archive as ArchiveIcon, CheckCircle as ActivateIcon, Pause as DeactivateIcon,
  Close as CloseIcon, DragIndicator as DragIcon,
} from '@mui/icons-material';
import axiosInstance from '@/api/axiosInstance';
import { MediaPicker } from '@/components/common/MediaPicker';
import type { MediaItem, UploadedMedia } from '@/components/common/MediaPicker';

// ─── Types ──────────────────────────────────────────────────────────────────

type ProductStatus = 'ACTIVE' | 'ARCHIVED' | 'DEACTIVATED';

interface Category { id: number; name: string; }
interface SubCategory { id: number; name: string; categoryId: number; }
interface Collection { id: number; name: string; }

interface ProductListItem {
  id: number;
  name: string;
  sku: string;
  categoryName: string;
  basePrice: number;
  stockQuantity: number;
  status: ProductStatus;
  isFeatured: boolean;
  isTrending: boolean;
  isNewArrival: boolean;
  createdAt: string;
}

interface ProductSpecification {
  id?: number;
  specKey: string;
  specValue: string;
  sortOrder: number;
}

interface ProductVariant {
  id?: number;
  material: string;
  size: string;
  color: string;
  price: number;
  stockQuantity: number;
}

interface ProductFormData {
  name: string;
  sku: string;
  barcode: string;
  shortDescription: string;
  longDescription: string;
  categoryId: number | '';
  subCategoryId: number | '';
  collectionId: number | '';
  brand: string;
  material: string;
  pattern: string;
  colors: string;
  sizes: string;
  stockQuantity: number;
  basePrice: number;
  discountPercentage: number;
  status: ProductStatus;
  isFeatured: boolean;
  isTrending: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isPremium: boolean;
  tags: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
}

interface TranslatedField {
  fieldName: string;
  en: string;
  hi: string;
  gu: string;
}

interface PageData<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const STATUSES: ProductStatus[] = ['ACTIVE', 'ARCHIVED', 'DEACTIVATED'];
const STATUS_COLORS: Record<ProductStatus, 'success' | 'default' | 'warning'> = {
  ACTIVE: 'success',
  ARCHIVED: 'default',
  DEACTIVATED: 'warning',
};

const LANGUAGES = ['EN', 'HI', 'GU'] as const;
type Language = typeof LANGUAGES[number];

const TRANSLATABLE_FIELDS = ['name', 'shortDescription', 'longDescription'] as const;

const EMPTY_FORM: ProductFormData = {
  name: '', sku: '', barcode: '', shortDescription: '', longDescription: '',
  categoryId: '', subCategoryId: '', collectionId: '', brand: '', material: '',
  pattern: '', colors: '', sizes: '', stockQuantity: 0, basePrice: 0,
  discountPercentage: 0, status: 'ACTIVE', isFeatured: false, isTrending: false,
  isNewArrival: false, isBestSeller: false, isPremium: false, tags: '',
  metaTitle: '', metaDescription: '', metaKeywords: '',
};

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

// ─── Sub-Components ─────────────────────────────────────────────────────────

function SpecificationEditor({ specs, onChange }: { specs: ProductSpecification[]; onChange: (s: ProductSpecification[]) => void }) {
  const addSpec = () => onChange([...specs, { specKey: '', specValue: '', sortOrder: specs.length }]);
  const removeSpec = (idx: number) => onChange(specs.filter((_, i) => i !== idx));
  const updateSpec = (idx: number, field: 'specKey' | 'specValue', value: string) => {
    const updated = [...specs];
    updated[idx] = { ...updated[idx], [field]: value };
    onChange(updated);
  };

  return (
    <Box>
      <Box className="flex items-center justify-between mb-2">
        <Typography variant="subtitle2">Specifications</Typography>
        <Button size="small" startIcon={<AddIcon />} onClick={addSpec}>Add</Button>
      </Box>
      {specs.map((spec, idx) => (
        <Box key={idx} className="flex gap-2 mb-2 items-center">
          <DragIcon className="text-gray-400 cursor-move" fontSize="small" />
          <TextField size="small" placeholder="Key (e.g. Material)" value={spec.specKey}
            onChange={(e) => updateSpec(idx, 'specKey', e.target.value)} sx={{ flex: 1 }} />
          <TextField size="small" placeholder="Value (e.g. Aluminium)" value={spec.specValue}
            onChange={(e) => updateSpec(idx, 'specValue', e.target.value)} sx={{ flex: 1 }} />
          <IconButton size="small" color="error" onClick={() => removeSpec(idx)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      ))}
      {specs.length === 0 && (
        <Typography variant="body2" className="text-gray-500 italic">No specifications added yet.</Typography>
      )}
    </Box>
  );
}

function VariantEditor({ variants, onChange }: { variants: ProductVariant[]; onChange: (v: ProductVariant[]) => void }) {
  const addVariant = () => onChange([...variants, { material: '', size: '', color: '', price: 0, stockQuantity: 0 }]);
  const removeVariant = (idx: number) => onChange(variants.filter((_, i) => i !== idx));
  const updateVariant = (idx: number, field: keyof ProductVariant, value: string | number) => {
    const updated = [...variants];
    updated[idx] = { ...updated[idx], [field]: value };
    onChange(updated);
  };

  return (
    <Box>
      <Box className="flex items-center justify-between mb-2">
        <Typography variant="subtitle2">Variant Pricing Matrix (Material × Size × Color → Price)</Typography>
        <Button size="small" startIcon={<AddIcon />} onClick={addVariant}>Add Variant</Button>
      </Box>
      {variants.length > 0 && (
        <TableContainer component={Paper} variant="outlined" sx={{ mb: 1 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Material</TableCell>
                <TableCell>Size</TableCell>
                <TableCell>Color</TableCell>
                <TableCell>Price (₹)</TableCell>
                <TableCell>Stock</TableCell>
                <TableCell width={50}></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {variants.map((v, idx) => (
                <TableRow key={idx}>
                  <TableCell>
                    <TextField size="small" value={v.material} onChange={(e) => updateVariant(idx, 'material', e.target.value)} fullWidth />
                  </TableCell>
                  <TableCell>
                    <TextField size="small" value={v.size} onChange={(e) => updateVariant(idx, 'size', e.target.value)} fullWidth />
                  </TableCell>
                  <TableCell>
                    <TextField size="small" value={v.color} onChange={(e) => updateVariant(idx, 'color', e.target.value)} fullWidth />
                  </TableCell>
                  <TableCell>
                    <TextField size="small" type="number" value={v.price} onChange={(e) => updateVariant(idx, 'price', parseFloat(e.target.value) || 0)} fullWidth />
                  </TableCell>
                  <TableCell>
                    <TextField size="small" type="number" value={v.stockQuantity} onChange={(e) => updateVariant(idx, 'stockQuantity', parseInt(e.target.value) || 0)} fullWidth />
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" color="error" onClick={() => removeVariant(idx)}><CloseIcon fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      {variants.length === 0 && (
        <Typography variant="body2" className="text-gray-500 italic">No variants configured. Base price will apply.</Typography>
      )}
    </Box>
  );
}

function TranslationTabs({ translations, onChange }: { translations: TranslatedField[]; onChange: (t: TranslatedField[]) => void }) {
  const [activeLang, setActiveLang] = useState<Language>('EN');

  const updateField = (fieldName: string, value: string) => {
    const langKey = activeLang.toLowerCase() as 'en' | 'hi' | 'gu';
    const updated = translations.map((t) =>
      t.fieldName === fieldName ? { ...t, [langKey]: value } : t
    );
    onChange(updated);
  };

  return (
    <Box>
      <Tabs value={activeLang} onChange={(_, v) => setActiveLang(v)} sx={{ mb: 2 }}>
        {LANGUAGES.map((lang) => <Tab key={lang} label={lang} value={lang} />)}
      </Tabs>
      {translations.map((field) => (
        <TextField
          key={field.fieldName}
          label={`${field.fieldName} (${activeLang})`}
          size="small"
          fullWidth
          multiline={field.fieldName.includes('Description')}
          rows={field.fieldName.includes('Description') ? 3 : 1}
          value={field[activeLang.toLowerCase() as 'en' | 'hi' | 'gu']}
          onChange={(e) => updateField(field.fieldName, e.target.value)}
          sx={{ mb: 2 }}
        />
      ))}
    </Box>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function ProductManagementPage() {
  // List state
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [totalElements, setTotalElements] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<ProductStatus | ''>('');
  const [filterCategory, setFilterCategory] = useState<number | ''>('');

  // Reference data
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);

  // Form state
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(EMPTY_FORM);
  const [formTab, setFormTab] = useState(0);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form sub-data
  const [specs, setSpecs] = useState<ProductSpecification[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [newMedia, setNewMedia] = useState<UploadedMedia[]>([]);
  const [translations, setTranslations] = useState<TranslatedField[]>(
    TRANSLATABLE_FIELDS.map((f) => ({ fieldName: f, en: '', hi: '', gu: '' }))
  );

  // Action state
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteProductId, setDeleteProductId] = useState<number | null>(null);

  // ─── Fetch Products ─────────────────────────────────────────────────────

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, size };
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus;
      if (filterCategory) params.categoryId = filterCategory;
      const response = await axiosInstance.get('/products', { params });
      const data: PageData<ProductListItem> = response.data.data;
      setProducts(data.content);
      setTotalElements(data.totalElements);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  }, [page, size, search, filterStatus, filterCategory]);

  const fetchReferenceData = useCallback(async () => {
    try {
      const [catRes, colRes] = await Promise.all([
        axiosInstance.get('/categories/tree'),
        axiosInstance.get('/collections'),
      ]);
      const catTree = catRes.data.data || [];
      setCategories(catTree.map((c: { id: number; name: string }) => ({ id: c.id, name: c.name })));
      const subs: SubCategory[] = [];
      catTree.forEach((c: { id: number; subCategories?: { id: number; name: string }[] }) => {
        (c.subCategories || []).forEach((sc) => subs.push({ id: sc.id, name: sc.name, categoryId: c.id }));
      });
      setSubCategories(subs);
      setCollections(colRes.data.data || []);
    } catch { /* handled */ }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { fetchReferenceData(); }, [fetchReferenceData]);

  // ─── Form Handlers ──────────────────────────────────────────────────────

  const openCreateForm = () => {
    setEditingId(null);
    setFormData(EMPTY_FORM);
    setSpecs([]);
    setVariants([]);
    setMediaItems([]);
    setNewMedia([]);
    setTranslations(TRANSLATABLE_FIELDS.map((f) => ({ fieldName: f, en: '', hi: '', gu: '' })));
    setFormTab(0);
    setFormError(null);
    setFormOpen(true);
  };

  const openEditForm = async (productId: number) => {
    setEditingId(productId);
    setFormTab(0);
    setFormError(null);
    setFormOpen(true);
    setSaving(true);
    try {
      const res = await axiosInstance.get(`/products/${productId}`);
      const p = res.data.data;
      setFormData({
        name: p.name || '', sku: p.sku || '', barcode: p.barcode || '',
        shortDescription: p.shortDescription || '', longDescription: p.longDescription || '',
        categoryId: p.categoryId || '', subCategoryId: p.subCategoryId || '',
        collectionId: p.collectionId || '', brand: p.brand || '', material: p.material || '',
        pattern: p.pattern || '', colors: Array.isArray(p.colors) ? p.colors.join(', ') : (p.colors || ''),
        sizes: Array.isArray(p.sizes) ? p.sizes.join(', ') : (p.sizes || ''),
        stockQuantity: p.stockQuantity || 0, basePrice: p.basePrice || 0,
        discountPercentage: p.discountPercentage || 0, status: p.status || 'ACTIVE',
        isFeatured: p.isFeatured || false, isTrending: p.isTrending || false,
        isNewArrival: p.isNewArrival || false, isBestSeller: p.isBestSeller || false,
        isPremium: p.isPremium || false,
        tags: Array.isArray(p.tags) ? p.tags.join(', ') : (p.tags || ''),
        metaTitle: p.metaTitle || '', metaDescription: p.metaDescription || '',
        metaKeywords: p.metaKeywords || '',
      });
      setSpecs(p.specifications || []);
      setVariants(p.variants || []);
      setMediaItems(p.images || []);
      setNewMedia([]);
      // Load translations
      if (p.translations) {
        const trans = TRANSLATABLE_FIELDS.map((f) => {
          const existing = p.translations.find((t: { fieldName: string }) => t.fieldName === f);
          return { fieldName: f, en: existing?.en || '', hi: existing?.hi || '', gu: existing?.gu || '' };
        });
        setTranslations(trans);
      } else {
        setTranslations(TRANSLATABLE_FIELDS.map((f) => ({ fieldName: f, en: '', hi: '', gu: '' })));
      }
    } catch {
      setFormError('Failed to load product details.');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setFormError(null);
    try {
      const payload = {
        ...formData,
        categoryId: formData.categoryId || null,
        subCategoryId: formData.subCategoryId || null,
        collectionId: formData.collectionId || null,
        colors: formData.colors.split(',').map((c) => c.trim()).filter(Boolean),
        sizes: formData.sizes.split(',').map((s) => s.trim()).filter(Boolean),
        tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
        specifications: specs,
        variants,
        translations: translations.filter((t) => t.hi || t.gu),
      };

      let productId = editingId;
      if (editingId) {
        await axiosInstance.put(`/products/${editingId}`, payload);
      } else {
        const res = await axiosInstance.post('/products', payload);
        productId = res.data.data?.id;
      }

      // Upload new media
      if (productId && newMedia.length > 0) {
        for (const media of newMedia) {
          const uploadPayload = {
            base64Data: media.base64Data,
            mimeType: media.mimeType,
            originalFilename: media.originalFilename,
            mediaType: media.mediaType === 'video' ? 'VIDEO' : 'IMAGE',
          };
          await axiosInstance.post(`/images/upload`, {
            ...uploadPayload,
            entityType: 'PRODUCT',
            entityId: productId,
          });
        }
      }

      setFormOpen(false);
      fetchProducts();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setFormError(error?.response?.data?.message || 'Failed to save product.');
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (field: keyof ProductFormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // ─── Product Actions ────────────────────────────────────────────────────

  const handleStatusAction = async (productId: number, action: string) => {
    setActionLoading(productId);
    try {
      await axiosInstance.put(`/products/${productId}/${action}`);
      await fetchProducts();
    } catch { /* handled */ }
    finally { setActionLoading(null); }
  };

  const handleDelete = async () => {
    if (!deleteProductId) return;
    setActionLoading(deleteProductId);
    try {
      await axiosInstance.delete(`/products/${deleteProductId}`);
      setDeleteDialogOpen(false);
      setDeleteProductId(null);
      await fetchProducts();
    } catch { /* handled */ }
    finally { setActionLoading(null); }
  };

  const handleMediaUpload = (files: UploadedMedia[]) => {
    setNewMedia((prev) => [...prev, ...files]);
  };

  const handleMediaReorder = (order: number[]) => {
    const reordered = order.map((id) => mediaItems.find((m) => m.id === id)!).filter(Boolean);
    setMediaItems(reordered);
  };

  const handleMediaDelete = async (mediaId: number) => {
    try {
      await axiosInstance.delete(`/images/${mediaId}`);
      setMediaItems((prev) => prev.filter((m) => m.id !== mediaId));
    } catch { /* handled */ }
  };

  const handleThumbnailSelect = (mediaId: number) => {
    setMediaItems((prev) =>
      prev.map((m) => ({ ...m, isThumbnail: m.id === mediaId }))
    );
    // Persist thumbnail selection
    axiosInstance.put(`/images/${mediaId}/thumbnail`).catch(() => {});
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { setPage(0); fetchProducts(); }
  };

  const filteredSubCategories = subCategories.filter(
    (sc) => !formData.categoryId || sc.categoryId === formData.categoryId
  );

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <Box className="p-6 max-w-full">
      <Box className="flex items-center justify-between mb-6">
        <Typography variant="h4" className="font-bold">Product Management</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreateForm}>
          Add Product
        </Button>
      </Box>

      {/* Filters */}
      <Paper className="p-4 mb-4">
        <Box className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <TextField
            label="Search products"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
          />
          <FormControl size="small">
            <InputLabel>Status</InputLabel>
            <Select value={filterStatus} label="Status"
              onChange={(e: SelectChangeEvent) => { setFilterStatus(e.target.value as ProductStatus | ''); setPage(0); }}>
              <MenuItem value="">All</MenuItem>
              {STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small">
            <InputLabel>Category</InputLabel>
            <Select value={filterCategory as string} label="Category"
              onChange={(e: SelectChangeEvent) => { setFilterCategory(e.target.value ? Number(e.target.value) : ''); setPage(0); }}>
              <MenuItem value="">All</MenuItem>
              {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </Select>
          </FormControl>
          <Button variant="outlined" size="small" onClick={() => { setSearch(''); setFilterStatus(''); setFilterCategory(''); setPage(0); }}>
            Clear
          </Button>
        </Box>
      </Paper>

      {/* Product Table */}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>SKU</TableCell>
              <TableCell>Category</TableCell>
              <TableCell align="right">Price</TableCell>
              <TableCell align="right">Stock</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Flags</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} align="center" className="py-8"><CircularProgress size={32} /></TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" className="py-8 text-gray-500">No products found</TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id} hover>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-gray-600 text-sm">{product.sku}</TableCell>
                  <TableCell>{product.categoryName || '—'}</TableCell>
                  <TableCell align="right">{formatCurrency(product.basePrice)}</TableCell>
                  <TableCell align="right">
                    <Chip label={product.stockQuantity} size="small"
                      color={product.stockQuantity <= 10 ? 'error' : 'default'} variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Chip label={product.status} size="small" color={STATUS_COLORS[product.status]} variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Box className="flex gap-0.5 flex-wrap">
                      {product.isFeatured && <Chip label="F" size="small" color="primary" sx={{ height: 20, fontSize: 10 }} />}
                      {product.isTrending && <Chip label="T" size="small" color="secondary" sx={{ height: 20, fontSize: 10 }} />}
                      {product.isNewArrival && <Chip label="N" size="small" color="info" sx={{ height: 20, fontSize: 10 }} />}
                    </Box>
                  </TableCell>
                  <TableCell className="text-sm">{formatDate(product.createdAt)}</TableCell>
                  <TableCell align="center">
                    <Box className="flex items-center justify-center gap-0.5">
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => openEditForm(product.id)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      {product.status === 'ACTIVE' && (
                        <>
                          <Tooltip title="Archive">
                            <IconButton size="small" color="default" onClick={() => handleStatusAction(product.id, 'archive')}
                              disabled={actionLoading === product.id}>
                              <ArchiveIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Deactivate">
                            <IconButton size="small" color="warning" onClick={() => handleStatusAction(product.id, 'deactivate')}
                              disabled={actionLoading === product.id}>
                              <DeactivateIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      {(product.status === 'ARCHIVED' || product.status === 'DEACTIVATED') && (
                        <Tooltip title="Activate">
                          <IconButton size="small" color="success" onClick={() => handleStatusAction(product.id, 'activate')}
                            disabled={actionLoading === product.id}>
                            <ActivateIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error"
                          onClick={() => { setDeleteProductId(product.id); setDeleteDialogOpen(true); }}>
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
        <TablePagination component="div" count={totalElements} page={page}
          onPageChange={(_, newPage) => setPage(newPage)} rowsPerPage={size}
          onRowsPerPageChange={(e) => { setSize(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[10, 20, 50]} />
      </TableContainer>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this product? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={actionLoading !== null}>Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Product Create/Edit Dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>{editingId ? 'Edit Product' : 'Create Product'}</DialogTitle>
        <DialogContent dividers>
          {formError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setFormError(null)}>{formError}</Alert>}

          <Tabs value={formTab} onChange={(_, v) => setFormTab(v)} sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
            <Tab label="Basic Info" />
            <Tab label="Media" />
            <Tab label="Specifications" />
            <Tab label="Variants" />
            <Tab label="Translations" />
          </Tabs>

          {/* Tab 0: Basic Info */}
          {formTab === 0 && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField label="Product Name" size="small" fullWidth required
                    value={formData.name} onChange={(e) => handleFieldChange('name', e.target.value)} />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField label="SKU" size="small" fullWidth required
                    value={formData.sku} onChange={(e) => handleFieldChange('sku', e.target.value)} />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField label="Barcode" size="small" fullWidth
                    value={formData.barcode} onChange={(e) => handleFieldChange('barcode', e.target.value)} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField label="Short Description" size="small" fullWidth multiline rows={2}
                    value={formData.shortDescription} onChange={(e) => handleFieldChange('shortDescription', e.target.value)} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField label="Long Description" size="small" fullWidth multiline rows={2}
                    value={formData.longDescription} onChange={(e) => handleFieldChange('longDescription', e.target.value)} />
                </Grid>

                {/* Category / SubCategory / Collection */}
                <Grid item xs={12} md={4}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Category</InputLabel>
                    <Select value={formData.categoryId as string} label="Category"
                      onChange={(e: SelectChangeEvent) => handleFieldChange('categoryId', e.target.value ? Number(e.target.value) : '')}>
                      <MenuItem value="">None</MenuItem>
                      {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Sub-Category</InputLabel>
                    <Select value={formData.subCategoryId as string} label="Sub-Category"
                      onChange={(e: SelectChangeEvent) => handleFieldChange('subCategoryId', e.target.value ? Number(e.target.value) : '')}>
                      <MenuItem value="">None</MenuItem>
                      {filteredSubCategories.map((sc) => <MenuItem key={sc.id} value={sc.id}>{sc.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Collection</InputLabel>
                    <Select value={formData.collectionId as string} label="Collection"
                      onChange={(e: SelectChangeEvent) => handleFieldChange('collectionId', e.target.value ? Number(e.target.value) : '')}>
                      <MenuItem value="">None</MenuItem>
                      {collections.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Material / Pattern / Brand */}
                <Grid item xs={12} md={4}>
                  <TextField label="Brand" size="small" fullWidth value={formData.brand}
                    onChange={(e) => handleFieldChange('brand', e.target.value)} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField label="Material" size="small" fullWidth value={formData.material}
                    onChange={(e) => handleFieldChange('material', e.target.value)} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField label="Pattern" size="small" fullWidth value={formData.pattern}
                    onChange={(e) => handleFieldChange('pattern', e.target.value)} />
                </Grid>

                {/* Colors / Sizes (comma-separated) */}
                <Grid item xs={12} md={6}>
                  <TextField label="Colors (comma-separated)" size="small" fullWidth
                    value={formData.colors} onChange={(e) => handleFieldChange('colors', e.target.value)}
                    helperText="e.g. Red, Blue, Green" />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField label="Sizes (comma-separated)" size="small" fullWidth
                    value={formData.sizes} onChange={(e) => handleFieldChange('sizes', e.target.value)}
                    helperText="e.g. Small, Medium, Large" />
                </Grid>

                {/* Pricing */}
                <Grid item xs={12}><Divider><Typography variant="caption">Pricing & Stock</Typography></Divider></Grid>
                <Grid item xs={12} md={3}>
                  <TextField label="Base Price (₹)" size="small" fullWidth type="number" required
                    value={formData.basePrice} onChange={(e) => handleFieldChange('basePrice', parseFloat(e.target.value) || 0)} />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField label="Discount %" size="small" fullWidth type="number"
                    value={formData.discountPercentage} onChange={(e) => handleFieldChange('discountPercentage', parseFloat(e.target.value) || 0)} />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField label="Stock Quantity" size="small" fullWidth type="number" required
                    value={formData.stockQuantity} onChange={(e) => handleFieldChange('stockQuantity', parseInt(e.target.value) || 0)} />
                </Grid>
                <Grid item xs={12} md={3}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select value={formData.status} label="Status"
                      onChange={(e: SelectChangeEvent) => handleFieldChange('status', e.target.value)}>
                      {STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Flags */}
                <Grid item xs={12}><Divider><Typography variant="caption">Product Flags</Typography></Divider></Grid>
                <Grid item xs={12}>
                  <Box className="flex flex-wrap gap-4">
                    <FormControlLabel control={<Checkbox checked={formData.isFeatured} onChange={(e) => handleFieldChange('isFeatured', e.target.checked)} />} label="Featured" />
                    <FormControlLabel control={<Checkbox checked={formData.isTrending} onChange={(e) => handleFieldChange('isTrending', e.target.checked)} />} label="Trending" />
                    <FormControlLabel control={<Checkbox checked={formData.isNewArrival} onChange={(e) => handleFieldChange('isNewArrival', e.target.checked)} />} label="New Arrival" />
                    <FormControlLabel control={<Checkbox checked={formData.isBestSeller} onChange={(e) => handleFieldChange('isBestSeller', e.target.checked)} />} label="Best Seller" />
                    <FormControlLabel control={<Checkbox checked={formData.isPremium} onChange={(e) => handleFieldChange('isPremium', e.target.checked)} />} label="Premium" />
                  </Box>
                </Grid>

                {/* SEO */}
                <Grid item xs={12}><Divider><Typography variant="caption">SEO & Tags</Typography></Divider></Grid>
                <Grid item xs={12} md={4}>
                  <TextField label="Meta Title" size="small" fullWidth value={formData.metaTitle}
                    onChange={(e) => handleFieldChange('metaTitle', e.target.value)} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField label="Meta Description" size="small" fullWidth value={formData.metaDescription}
                    onChange={(e) => handleFieldChange('metaDescription', e.target.value)} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField label="Meta Keywords" size="small" fullWidth value={formData.metaKeywords}
                    onChange={(e) => handleFieldChange('metaKeywords', e.target.value)} />
                </Grid>
                <Grid item xs={12}>
                  <TextField label="Tags (comma-separated)" size="small" fullWidth value={formData.tags}
                    onChange={(e) => handleFieldChange('tags', e.target.value)} helperText="e.g. luxury, modern, sheer" />
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Tab 1: Media */}
          {formTab === 1 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>Upload Images & Videos</Typography>
              <Typography variant="body2" className="text-gray-500 mb-3">
                Upload product images (JPEG, PNG, WebP, SVG up to 5MB) and videos (MP4, WebM up to 10MB, max 10s).
                Click a thumbnail to set it as the main product image.
              </Typography>
              <MediaPicker
                accept="both"
                multiple
                onUpload={handleMediaUpload}
                existingMedia={mediaItems}
                onReorder={handleMediaReorder}
                onDelete={handleMediaDelete}
              />
              {/* Thumbnail selection for existing media */}
              {mediaItems.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>Select Thumbnail</Typography>
                  <Box className="flex gap-2 flex-wrap">
                    {mediaItems.filter((m) => m.mediaType === 'image').map((m) => (
                      <Box
                        key={m.id}
                        onClick={() => handleThumbnailSelect(m.id)}
                        sx={{
                          width: 80, height: 80, borderRadius: 1, overflow: 'hidden', cursor: 'pointer',
                          border: m.isThumbnail ? '3px solid #1976d2' : '2px solid #e0e0e0',
                          opacity: m.isThumbnail ? 1 : 0.7,
                          '&:hover': { opacity: 1 },
                        }}
                      >
                        <img src={`data:${m.mimeType};base64,${m.base64Data}`}
                          alt={m.originalFilename} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
              {/* Newly added media preview */}
              {newMedia.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    New Uploads ({newMedia.length})
                  </Typography>
                  <Box className="flex gap-2 flex-wrap">
                    {newMedia.map((m, idx) => (
                      <Box key={idx} sx={{ width: 80, height: 80, borderRadius: 1, overflow: 'hidden', border: '2px solid #4caf50' }}>
                        {m.mediaType === 'image' ? (
                          <img src={m.previewUrl} alt={m.originalFilename} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <video src={m.previewUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        )}
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}

          {/* Tab 2: Specifications */}
          {formTab === 2 && (
            <SpecificationEditor specs={specs} onChange={setSpecs} />
          )}

          {/* Tab 3: Variants */}
          {formTab === 3 && (
            <VariantEditor variants={variants} onChange={setVariants} />
          )}

          {/* Tab 4: Translations */}
          {formTab === 4 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>Multi-language Content</Typography>
              <Typography variant="body2" className="text-gray-500 mb-3">
                Provide translations for product fields. English (EN) is the default language.
                Hindi (HI) and Gujarati (GU) translations are optional and will fall back to English if empty.
              </Typography>
              <TranslationTabs translations={translations} onChange={setTranslations} />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? <CircularProgress size={20} sx={{ mr: 1 }} /> : null}
            {editingId ? 'Update Product' : 'Create Product'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
