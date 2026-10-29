import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Link, useBlocker, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Alert, Button, Chip, CircularProgress, Collapse, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControlLabel, IconButton, InputAdornment, LinearProgress, MenuItem, Switch, TextField, Tooltip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import axiosInstance from '@/api/axiosInstance';
import { mediaSource } from '@/components/common/MediaPicker';
import { PageHeader, Panel, Pill } from '@/components/admin/AdminUi';
import { formatPrice, sizeNumber } from '@/utils/price';

// ─── Types ──────────────────────────────────────────────────────────────────

type Status = 'ACTIVE' | 'ARCHIVED' | 'DEACTIVATED';

interface Category { id: number; name: string; }
interface SubCategory { id: number; name: string; }
interface ProductOption { id: number; name: string; internalName?: string | null; sku: string; }
interface Media {
  id: number;
  base64Data: string;
  mimeType: string;
  mediaType: string;
  originalFilename?: string;
  isThumbnail?: boolean;
  sortOrder?: number;
}
interface Spec { specKey: string; specValue: string; showToCustomers: boolean; sortOrder?: number; }

/** Starter rows; the admin fills in the values and can rename or remove any row. */
const SPEC_PRESETS: { label: string; match: RegExp; rows: { key: string; hint: string }[] }[] = [
  {
    label: 'Track weights',
    match: /track(?!\s*runner)/i,
    rows: [
      { key: 'Track weight without PVC (per metre)', hint: 'e.g. 380 g' },
      { key: 'PVC insert weight (per metre)', hint: 'e.g. 70 g' },
      { key: 'Combined weight per metre', hint: 'e.g. 450 g' },
    ],
  },
  {
    label: 'Runner weight and wheel',
    match: /runner/i,
    rows: [
      { key: 'Weight', hint: 'e.g. 4 g' },
      { key: 'Wheel diameter', hint: 'e.g. 12 mm' },
    ],
  },
];
const SPEC_HINTS: Record<string, string> = Object.fromEntries(
  SPEC_PRESETS.flatMap((p) => p.rows.map((r) => [r.key, r.hint])),
);
interface Variant { size?: string | null; color?: string | null; price: number; material?: string | null; stockQuantity?: number; }

interface Form {
  name: string;
  internalName: string;
  sku: string;
  categoryId: number | '';
  subCategoryId: number | '';
  shortDescription: string;
  longDescription: string;
  brand: string;
  material: string;
  pattern: string;
  tags: string;
  metaTitle: string;
  metaDescription: string;
  stockQuantity: number;
  discountPercentage: number;
  status: Status;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  isTrending: boolean;
  isPremium: boolean;
}

interface Translation { name: string; shortDescription: string; longDescription: string; }

const EMPTY_FORM: Form = {
  name: '', internalName: '', sku: '', categoryId: '', subCategoryId: '', shortDescription: '', longDescription: '',
  brand: 'GLYDE', material: '', pattern: '', tags: '', metaTitle: '', metaDescription: '',
  stockQuantity: 100, discountPercentage: 0, status: 'ACTIVE',
  isFeatured: false, isNewArrival: true, isBestSeller: false, isTrending: false, isPremium: false,
};

const EMPTY_TRANSLATION: Translation = { name: '', shortDescription: '', longDescription: '' };
const PLACEHOLDER_FILENAME = 'photo-coming-soon.jpg';
const MAX_VIDEO_MB = 20;
const MAX_VIDEO_SECONDS = 30;

/** Key for one cell of the price grid. An empty colour means "every colour". */
const cellKey = (size: string, colour: string) => `${size}\u0000${colour}`;

function sortSizes(sizes: string[]): string[] {
  return [...sizes].sort((a, b) => sizeNumber(a) - sizeNumber(b));
}

function slugCode(name: string): string {
  const base = name.toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30);
  return `GLYDE-${base || 'ITEM'}-${Date.now().toString(36).slice(-4).toUpperCase()}`;
}

function errorMessage(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: { message?: string; errors?: Record<string, string> } } };
  const fields = e.response?.data?.errors;
  return (fields && Object.values(fields)[0]) || e.response?.data?.message || fallback;
}

/** Shrinks phone photos to web size before upload (max 2000px, JPEG), so they stay under 5 MB. */
async function prepareImage(file: File): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 1.5 * 1024 * 1024) return file;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.86));
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch {
    return file;
  }
}

function videoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => { URL.revokeObjectURL(video.src); resolve(video.duration); };
    video.onerror = () => resolve(0);
    video.src = URL.createObjectURL(file);
  });
}

// ─── Small pieces ───────────────────────────────────────────────────────────

/** Type a value and press Enter (or comma) to add it as a chip. */
function ChipInput({ label, values, onChange, placeholder, helper }: { label: string; values: string[]; onChange: (v: string[]) => void; placeholder: string; helper?: string }) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const parts = draft.split(',').map((p) => p.trim()).filter(Boolean);
    const next = [...values];
    parts.forEach((p) => { if (!next.some((v) => v.toLowerCase() === p.toLowerCase())) next.push(p); });
    onChange(next);
    setDraft('');
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); }
    if (e.key === 'Backspace' && !draft && values.length) onChange(values.slice(0, -1));
  };
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium">{label}</p>
      <div className="flex min-h-[44px] flex-wrap items-center gap-1.5 rounded-lg border border-[#14232b]/20 bg-white px-2 py-1.5 focus-within:border-[#a8400f] focus-within:ring-1 focus-within:ring-[#a8400f]">
        {values.map((v) => (
          <Chip key={v} label={v} size="small" onDelete={() => onChange(values.filter((x) => x !== v))} />
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
          onBlur={() => draft.trim() && add()}
          placeholder={values.length ? 'Add another' : placeholder}
          className="min-w-[8rem] flex-1 border-0 bg-transparent px-1 py-1 text-sm outline-none"
          aria-label={label}
        />
      </div>
      {helper && <p className="mt-1 text-xs text-[#4b5b63]">{helper}</p>}
    </div>
  );
}

function PriceInput({ value, onChange, label }: { value: string; onChange: (v: string) => void; label?: string }) {
  return (
    <TextField
      size="small"
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ''))}
      placeholder="On request"
      inputProps={{ inputMode: 'decimal', 'aria-label': label }}
      InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
      sx={{ minWidth: 120, bgcolor: 'white' }}
      fullWidth
    />
  );
}

function Field({ children, label, hint }: { children: ReactNode; label?: string; hint?: string }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium">{label}</span>}
      {children}
      {hint && <span className="mt-1 block text-xs text-[#4b5b63]">{hint}</span>}
    </label>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function ProductEditorPage() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const productId = isNew ? null : Number(id);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const justCopied = searchParams.get('copied') === '1';
  const fileInput = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(!isNew);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(EMPTY_FORM);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [colours, setColours] = useState<string[]>([]);
  const [sameForColours, setSameForColours] = useState(true);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [singlePrice, setSinglePrice] = useState('');
  const [specs, setSpecs] = useState<Spec[]>([]);
  const [media, setMedia] = useState<Media[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(0);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [translations, setTranslations] = useState<Record<'hi' | 'gu', Translation>>({ hi: EMPTY_TRANSLATION, gu: EMPTY_TRANSLATION });
  const [showMore, setShowMore] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [copying, setCopying] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [existing, setExisting] = useState<ProductOption[]>([]);

  const blocker = useBlocker(({ currentLocation, nextLocation }) => dirty && !saving && currentLocation.pathname !== nextLocation.pathname);

  const touch = () => { setDirty(true); setSaved(false); };
  const setSpec = (i: number, patch: Partial<Spec>) => { setSpecs((s) => s.map((x, j) => (j === i ? { ...x, ...patch } : x))); touch(); };
  const addSpecPreset = (keys: string[]) => {
    setSpecs((s) => {
      const have = new Set(s.map((x) => x.specKey.trim().toLowerCase()));
      return [...s, ...keys.filter((k) => !have.has(k.toLowerCase())).map((k) => ({ specKey: k, specValue: '', showToCustomers: true }))];
    });
    touch();
  };
  // Category, sub-category and name decide which quick-add button is highlighted.
  const specCategoryText = [
    categories.find((c) => c.id === form.categoryId)?.name,
    subCategories.find((c) => c.id === form.subCategoryId)?.name,
    form.name,
  ].filter(Boolean).join(' ');
  const update = <K extends keyof Form>(key: K, value: Form[K]) => { setForm((f) => ({ ...f, [key]: value })); touch(); };

  // ─── Load ───────────────────────────────────────────────────────────────

  useEffect(() => {
    axiosInstance.get('/categories').then((res) => setCategories(res.data.data ?? [])).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!form.categoryId) { setSubCategories([]); return; }
    axiosInstance.get(`/categories/${form.categoryId}/sub-categories`)
      .then((res) => setSubCategories(res.data.data ?? []))
      .catch(() => setSubCategories([]));
  }, [form.categoryId]);

  const loadProduct = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const [res, trRes] = await Promise.all([
        axiosInstance.get(`/products/${productId}`),
        axiosInstance.get(`/products/${productId}/translations`).catch(() => ({ data: { data: {} } })),
      ]);
      const p = res.data.data;
      setForm({
        name: p.name ?? '', internalName: p.internalName ?? '', sku: p.sku ?? '', categoryId: p.categoryId ?? '', subCategoryId: p.subCategoryId ?? '',
        shortDescription: p.shortDescription ?? '', longDescription: p.longDescription ?? '',
        brand: p.brand ?? '', material: p.material ?? '', pattern: p.pattern ?? '',
        tags: (p.tags ?? []).join(', '), metaTitle: p.metaTitle ?? '', metaDescription: p.metaDescription ?? '',
        stockQuantity: p.stockQuantity ?? 0, discountPercentage: p.discountPercentage ?? 0, status: p.status ?? 'ACTIVE',
        isFeatured: !!p.isFeatured, isNewArrival: !!p.isNewArrival, isBestSeller: !!p.isBestSeller,
        isTrending: !!p.isTrending, isPremium: !!p.isPremium,
      });
      const variants: Variant[] = p.variants ?? [];
      const sizeList: string[] = [...(p.sizes ?? [])];
      const colourList: string[] = [...(p.colors ?? [])];
      variants.forEach((v) => {
        if (v.size && !sizeList.includes(v.size)) sizeList.push(v.size);
        if (v.color && !colourList.includes(v.color)) colourList.push(v.color);
      });
      setSizes(sortSizes(sizeList));
      setColours(colourList);
      // Colours "cost the same" when every size has one price across its colours.
      const bySize = new Map<string, Set<number>>();
      variants.forEach((v) => {
        const key = v.size ?? '';
        bySize.set(key, (bySize.get(key) ?? new Set()).add(Number(v.price)));
      });
      const uniform = [...bySize.values()].every((set) => set.size <= 1);
      setSameForColours(uniform);
      const grid: Record<string, string> = {};
      variants.forEach((v) => {
        const price = Number(v.price) > 0 ? String(Number(v.price)) : '';
        if (uniform) grid[cellKey(v.size ?? '', '')] = price;
        grid[cellKey(v.size ?? '', v.color ?? '')] = price;
      });
      setPrices(grid);
      setSinglePrice(Number(p.basePrice) > 0 && variants.length === 0 ? String(Number(p.basePrice)) : '');
      setSpecs([...(p.specifications ?? [])]
        .sort((a: Spec, b: Spec) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((s: Spec) => ({ specKey: s.specKey, specValue: s.specValue, showToCustomers: s.showToCustomers !== false })));
      setMedia(p.images ?? []);
      const tr = trRes.data.data ?? {};
      setTranslations({
        hi: { ...EMPTY_TRANSLATION, ...(tr.hi ?? tr.HI ?? {}) },
        gu: { ...EMPTY_TRANSLATION, ...(tr.gu ?? tr.GU ?? {}) },
      });
      setDirty(false);
      setLoadError(null);
    } catch (err) {
      setLoadError(errorMessage(err, 'Could not load this product.'));
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => { loadProduct(); }, [loadProduct]);

  // On "Add a product", offer the existing products as a starting point.
  useEffect(() => {
    if (!isNew) return;
    axiosInstance.get('/products', { params: { page: 0, size: 500 } })
      .then((res) => setExisting((res.data.data.content ?? []).sort((a: ProductOption, b: ProductOption) => a.name.localeCompare(b.name, undefined, { numeric: true }))))
      .catch(() => setExisting([]));
  }, [isNew]);

  /** Copies a product (details, sizes, colours, prices, photos) and opens the copy, hidden, to edit. */
  const copyFrom = async (sourceId: number) => {
    setCopying(true);
    setCopyError(null);
    try {
      const res = await axiosInstance.post(`/products/${sourceId}/duplicate`);
      setDirty(false);
      navigate(`/admin/products/${res.data.data.id}?copied=1`);
    } catch (err) {
      setCopyError(errorMessage(err, 'Could not copy the product.'));
    } finally {
      setCopying(false);
    }
  };

  // ─── Prices ─────────────────────────────────────────────────────────────

  const sortedSizes = useMemo(() => sortSizes(sizes), [sizes]);
  const hasOptions = sizes.length > 0 || colours.length > 0;
  const priceColumns = sameForColours || colours.length === 0 ? [''] : colours;
  const priceRows = sizes.length ? sortedSizes : [''];

  const priceFor = (size: string, colour: string): number => {
    const raw = sameForColours || colours.length === 0 ? prices[cellKey(size, '')] : prices[cellKey(size, colour)];
    const n = Number(raw);
    return raw && n > 0 ? n : 0;
  };

  /** One variant per size and colour, in the order customers see them. */
  const variants = useMemo<Variant[]>(() => {
    if (!hasOptions) return [];
    const rows = sizes.length ? sortedSizes : [null];
    const cols = colours.length ? colours : [null];
    return rows.flatMap((size) => cols.map((colour) => ({
      size, color: colour, material: form.material || null, stockQuantity: form.stockQuantity,
      price: priceFor(size ?? '', colour ?? ''),
    })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasOptions, sizes, sortedSizes, colours, prices, sameForColours, form.material, form.stockQuantity]);

  /** The price the product is listed at: the smallest size's first priced option. */
  const listedPrice = hasOptions ? (variants.find((v) => v.price > 0)?.price ?? 0) : Number(singlePrice) || 0;
  const pricedCount = variants.filter((v) => v.price > 0).length;

  const setCell = (size: string, colour: string, value: string) => { setPrices((p) => ({ ...p, [cellKey(size, colour)]: value })); touch(); };

  const fillEmpty = (value: string) => {
    setPrices((p) => {
      const next = { ...p };
      priceRows.forEach((s) => priceColumns.forEach((c) => { if (!next[cellKey(s, c)]) next[cellKey(s, c)] = value; }));
      return next;
    });
    touch();
  };

  const switchSameForColours = (same: boolean) => {
    setPrices((p) => {
      const next = { ...p };
      priceRows.forEach((s) => {
        if (same) {
          if (!next[cellKey(s, '')]) next[cellKey(s, '')] = colours.map((c) => next[cellKey(s, c)]).find(Boolean) ?? '';
        } else {
          colours.forEach((c) => { if (!next[cellKey(s, c)]) next[cellKey(s, c)] = next[cellKey(s, '')] ?? ''; });
        }
      });
      return next;
    });
    setSameForColours(same);
    touch();
  };

  // ─── Media ──────────────────────────────────────────────────────────────

  const realMedia = media.filter((m) => m.originalFilename !== PLACEHOLDER_FILENAME);

  const uploadOne = async (file: File, targetId: number) => {
    const isVideo = file.type.startsWith('video/');
    const prepared = isVideo ? file : await prepareImage(file);
    const body = new FormData();
    body.append('file', prepared);
    body.append('entityType', 'product');
    body.append('entityId', String(targetId));
    await axiosInstance.post(isVideo ? '/images/upload-video' : '/images/upload', body, { headers: { 'Content-Type': 'multipart/form-data' } });
  };

  const checkFiles = async (files: File[]): Promise<File[]> => {
    const ok: File[] = [];
    const problems: string[] = [];
    for (const file of files) {
      if (file.type.startsWith('video/')) {
        if (!/video\/(mp4|webm)/.test(file.type)) { problems.push(`${file.name}: videos must be MP4 or WebM.`); continue; }
        if (file.size > MAX_VIDEO_MB * 1024 * 1024) { problems.push(`${file.name}: videos can be up to ${MAX_VIDEO_MB} MB.`); continue; }
        const seconds = await videoDuration(file);
        if (seconds > MAX_VIDEO_SECONDS) { problems.push(`${file.name}: videos can be up to ${MAX_VIDEO_SECONDS} seconds long.`); continue; }
        ok.push(file);
      } else if (/image\/(jpeg|png|webp|svg\+xml)/.test(file.type)) {
        ok.push(file);
      } else {
        problems.push(`${file.name}: use a JPG, PNG or WebP photo, or an MP4 video.`);
      }
    }
    setMediaError(problems.length ? problems.join(' ') : null);
    return ok;
  };

  const addFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    const files = await checkFiles(Array.from(list));
    if (!files.length) return;
    if (!productId) {
      setPendingFiles((p) => [...p, ...files]);
      touch();
      return;
    }
    setUploading((n) => n + files.length);
    for (const file of files) {
      try {
        await uploadOne(file, productId);
      } catch (err) {
        setMediaError(errorMessage(err, `Could not upload ${file.name}.`));
      } finally {
        setUploading((n) => n - 1);
      }
    }
    const res = await axiosInstance.get(`/products/${productId}`);
    setMedia(res.data.data.images ?? []);
  };

  const makeMain = async (item: Media) => {
    setMedia((list) => list.map((m) => ({ ...m, isThumbnail: m.id === item.id })));
    await axiosInstance.put(`/images/${item.id}/thumbnail`).catch(() => undefined);
  };

  const move = async (index: number, delta: number) => {
    const next = [...realMedia];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setMedia(next);
    if (productId) await axiosInstance.put(`/images/product/${productId}/order`, next.map((m) => m.id)).catch(() => undefined);
  };

  const removeMedia = async (item: Media) => {
    if (!window.confirm('Delete this photo or video from the product?')) return;
    try {
      await axiosInstance.delete(`/images/${item.id}`);
      const res = await axiosInstance.get(`/products/${productId}`);
      setMedia(res.data.data.images ?? []);
    } catch (err) {
      setMediaError(errorMessage(err, 'Could not delete it.'));
    }
  };

  // ─── Save ───────────────────────────────────────────────────────────────

  const canSave = form.name.trim() && form.categoryId;

  const save = async () => {
    if (!canSave) {
      setSaveError('Give the product a name and choose its category.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const payload = {
        ...form,
        sku: form.sku.trim() || slugCode(form.name),
        name: form.name.trim(),
        internalName: form.internalName.trim(),
        categoryId: form.categoryId || null,
        subCategoryId: form.subCategoryId || null,
        colors: colours,
        sizes: sortedSizes,
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        basePrice: listedPrice,
        stockQuantity: Number(form.stockQuantity) || 0,
        discountPercentage: Number(form.discountPercentage) || 0,
      };
      let idToUse = productId;
      if (productId) {
        await axiosInstance.put(`/products/${productId}`, payload);
      } else {
        const res = await axiosInstance.post('/products', payload);
        idToUse = res.data.data.id;
      }
      if (!idToUse) throw new Error('No product id');
      await axiosInstance.put(`/products/${idToUse}/variants`, variants);
      await axiosInstance.put(`/products/${idToUse}/specifications`,
        specs.filter((s) => s.specKey.trim() && s.specValue.trim()).map((s, i) => ({ ...s, specKey: s.specKey.trim(), specValue: s.specValue.trim(), sortOrder: i })));
      for (const lang of ['hi', 'gu'] as const) {
        const t = translations[lang];
        const filled = Object.fromEntries(Object.entries(t).filter(([, v]) => v.trim()));
        if (Object.keys(filled).length) await axiosInstance.put(`/products/${idToUse}/translations/${lang}`, filled);
      }
      if (pendingFiles.length) {
        for (const file of pendingFiles) await uploadOne(file, idToUse);
        setPendingFiles([]);
      }
      setDirty(false);
      setSaved(true);
      if (!productId) {
        navigate(`/admin/products/${idToUse}`, { replace: true });
      } else {
        await loadProduct();
        setSaved(true);
      }
    } catch (err) {
      setSaveError(errorMessage(err, 'Could not save the product. Nothing on the website has changed.'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async () => {
    if (!productId) return;
    try {
      await axiosInstance.delete(`/products/${productId}`);
      setDirty(false);
      navigate('/admin/products', { replace: true });
    } catch (err) {
      setSaveError(errorMessage(err, 'Could not delete the product.'));
      setDeleteOpen(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────

  if (loading) {
    return <div className="flex justify-center py-24"><CircularProgress /></div>;
  }
  if (loadError) {
    return (
      <div className="space-y-4">
        <Alert severity="error">{loadError}</Alert>
        <Button component={Link} to="/admin/products" startIcon={<ArrowBackIcon />}>Back to products</Button>
      </div>
    );
  }

  const shown = form.status === 'ACTIVE';

  return (
    <div className="pb-24">
      <Link to="/admin/products" className="mb-3 inline-flex items-center gap-1 text-sm text-[#4b5b63] hover:text-[#14232b]">
        <ArrowBackIcon sx={{ fontSize: 16 }} /> All products
      </Link>
      <PageHeader
        title={isNew ? 'Add a product' : form.name || 'Untitled product'}
        subtitle={isNew ? 'Fill in what customers should see. You can change anything later.' : (
          <span className="flex flex-wrap items-center gap-2">
            {shown ? <Pill tone="good">On the website</Pill> : <Pill tone="attention">Hidden</Pill>}
            <span>Listed at {formatPrice(listedPrice)}</span>
          </span>
        )}
        actions={!isNew && (
          <div className="flex flex-wrap gap-2">
            <Tooltip title={dirty ? 'Save your changes first, then make a copy.' : 'Copies everything into a new product you can change.'}>
              <span>
                <Button variant="outlined" startIcon={<ContentCopyIcon sx={{ fontSize: 16 }} />} disabled={dirty || copying} onClick={() => productId && copyFrom(productId)}>
                  {copying ? 'Copying…' : 'Make a copy'}
                </Button>
              </span>
            </Tooltip>
            {shown && (
              <Button href={`/products/${productId}`} target="_blank" rel="noreferrer" endIcon={<OpenInNewIcon sx={{ fontSize: 16 }} />}>
                See it on the website
              </Button>
            )}
          </div>
        )}
      />

      {saveError && <Alert severity="error" className="mb-4" onClose={() => setSaveError(null)}>{saveError}</Alert>}
      {copyError && <Alert severity="error" className="mb-4" onClose={() => setCopyError(null)}>{copyError}</Alert>}
      {justCopied && !isNew && (
        <Alert
          severity="info"
          className="mb-4"
          onClose={() => { const next = new URLSearchParams(searchParams); next.delete('copied'); setSearchParams(next, { replace: true }); }}
        >
          This is a copy, with the same details, sizes, colours, prices and photos. It is hidden from the website for now.
          Change the name and anything else that is different, switch on “Show on the website”, then save.
        </Alert>
      )}
      {isNew && existing.length > 0 && (
        <div className="mb-6 rounded-xl border border-dashed border-[#14232b]/20 bg-white p-4">
          <p className="text-sm font-semibold">Save time: start from an existing product</p>
          <p className="mb-3 text-sm text-[#4b5b63]">Pick a similar product to copy its details, sizes, colours, prices and photos. You then change only what is different.</p>
          <TextField
            select
            size="small"
            value=""
            label="Copy from"
            onChange={(e) => e.target.value && copyFrom(Number(e.target.value))}
            disabled={copying}
            sx={{ minWidth: 280, maxWidth: '100%' }}
          >
            {existing.map((p) => (
              <MenuItem key={p.id} value={String(p.id)}>
                {p.name}{p.internalName ? ` · ${p.internalName}` : ''}
              </MenuItem>
            ))}
          </TextField>
          {copying && <LinearProgress className="mt-3" />}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-6">
          {/* Basics */}
          <Panel title="What it is">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name on the website" hint="What customers see.">
                <TextField value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="e.g. Silent Runner" fullWidth size="small" required error={!!saveError && !form.name.trim()} />
              </Field>
              <Field label="Internal name (optional)" hint="Only shown in the admin panel, e.g. supplier code or shop shorthand.">
                <TextField value={form.internalName} onChange={(e) => update('internalName', e.target.value)} placeholder="e.g. SR-12 runner, Mumbai supplier" fullWidth size="small" />
              </Field>
              <Field label="Category">
                <TextField select value={form.categoryId === '' ? '' : String(form.categoryId)} onChange={(e) => { update('categoryId', e.target.value ? Number(e.target.value) : ''); update('subCategoryId', ''); }} fullWidth size="small" error={!!saveError && !form.categoryId}>
                  <MenuItem value="">Choose a category</MenuItem>
                  {categories.map((c) => <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>)}
                </TextField>
              </Field>
              <Field label="Type (optional)">
                <TextField select value={form.subCategoryId === '' ? '' : String(form.subCategoryId)} onChange={(e) => update('subCategoryId', e.target.value ? Number(e.target.value) : '')} fullWidth size="small" disabled={!subCategories.length}>
                  <MenuItem value="">None</MenuItem>
                  {subCategories.map((c) => <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>)}
                </TextField>
              </Field>
              <div className="sm:col-span-2">
                <Field label="One-line summary" hint="Shown in product lists and at the top of the product page.">
                  <TextField value={form.shortDescription} onChange={(e) => update('shortDescription', e.target.value)} fullWidth size="small" multiline maxRows={3} />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Full description">
                  <TextField value={form.longDescription} onChange={(e) => update('longDescription', e.target.value)} fullWidth size="small" multiline minRows={4} />
                </Field>
              </div>
            </div>
          </Panel>

          {/* Media */}
          <Panel
            title="Photos and videos"
            description="The starred photo is shown first. Big phone photos are resized automatically. Videos: MP4, up to 30 seconds."
          >
            <div
              className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
            >
              {realMedia.map((item, index) => {
                const src = mediaSource(item.base64Data, item.mimeType);
                const isVideo = item.mediaType?.toUpperCase() === 'VIDEO';
                return (
                  <figure key={item.id} className={`group relative overflow-hidden rounded-lg border bg-[#f3f5f6] ${item.isThumbnail ? 'border-[#a8400f] ring-2 ring-[#a8400f]/30' : 'border-[#14232b]/10'}`}>
                    <div className="aspect-square">
                      {isVideo ? (
                        <div className="relative h-full w-full">
                          <video src={`${src}#t=0.5`} className="h-full w-full object-cover" muted preload="metadata" />
                          <PlayCircleOutlineIcon className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white drop-shadow" sx={{ fontSize: 40 }} />
                        </div>
                      ) : (
                        <img src={src} alt={item.originalFilename ?? ''} className="h-full w-full object-cover" loading="lazy" />
                      )}
                    </div>
                    <figcaption className="flex items-center justify-between bg-white px-1 py-0.5">
                      {isVideo ? (
                        <span className="px-2 text-xs text-[#4b5b63]">Video</span>
                      ) : (
                        <Tooltip title={item.isThumbnail ? 'Main photo' : 'Make this the main photo'}>
                          <IconButton size="small" onClick={() => makeMain(item)} aria-label="Make main photo">
                            {item.isThumbnail ? <StarIcon fontSize="small" sx={{ color: '#a8400f' }} /> : <StarBorderIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                      )}
                      <span className="flex">
                        <IconButton size="small" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move earlier"><ArrowBackIosNewIcon sx={{ fontSize: 14 }} /></IconButton>
                        <IconButton size="small" onClick={() => move(index, 1)} disabled={index === realMedia.length - 1} aria-label="Move later"><ArrowForwardIcon sx={{ fontSize: 16 }} /></IconButton>
                        <IconButton size="small" onClick={() => removeMedia(item)} aria-label="Delete"><DeleteOutlineIcon fontSize="small" /></IconButton>
                      </span>
                    </figcaption>
                  </figure>
                );
              })}
              {pendingFiles.map((file, i) => (
                <figure key={`${file.name}-${i}`} className="relative overflow-hidden rounded-lg border border-dashed border-[#14232b]/25 bg-[#f3f5f6]">
                  <div className="aspect-square">
                    {file.type.startsWith('video/') ? (
                      <video src={URL.createObjectURL(file)} className="h-full w-full object-cover" muted />
                    ) : (
                      <img src={URL.createObjectURL(file)} alt={file.name} className="h-full w-full object-cover" />
                    )}
                  </div>
                  <figcaption className="flex items-center justify-between bg-white px-2 py-1 text-xs text-[#4b5b63]">
                    Uploads when you save
                    <IconButton size="small" onClick={() => setPendingFiles((p) => p.filter((_, j) => j !== i))} aria-label="Remove"><CloseIcon sx={{ fontSize: 16 }} /></IconButton>
                  </figcaption>
                </figure>
              ))}
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="flex aspect-square flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-[#14232b]/20 bg-white text-sm text-[#4b5b63] transition-colors hover:border-[#a8400f] hover:text-[#a8400f]"
              >
                <CloudUploadOutlinedIcon />
                Add photos or videos
                <span className="text-xs">or drop them here</span>
              </button>
            </div>
            <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
            {uploading > 0 && <div className="mt-3"><LinearProgress /><p className="mt-1 text-xs text-[#4b5b63]">Uploading {uploading} file{uploading === 1 ? '' : 's'}…</p></div>}
            {mediaError && <Alert severity="warning" className="mt-3" onClose={() => setMediaError(null)}>{mediaError}</Alert>}
            {realMedia.length === 0 && pendingFiles.length === 0 && (
              <p className="mt-3 text-sm text-[#b45309]">No photo yet, so the website shows a “Photo coming soon” picture.</p>
            )}
          </Panel>

          {/* Options and prices */}
          <Panel
            title="Sizes, colours and prices"
            description="Add the sizes and colours you sell. Leave a price empty to show “Price on request” for that option."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <ChipInput label="Sizes" values={sizes} onChange={(v) => { setSizes(v); touch(); }} placeholder="e.g. 4 ft, then press Enter" helper="Shown smallest first." />
              <ChipInput label="Colours" values={colours} onChange={(v) => { setColours(v); touch(); }} placeholder="e.g. White, then press Enter" helper="The first colour is selected by default." />
            </div>

            {!hasOptions ? (
              <div className="mt-5 max-w-xs">
                <Field label="Price" hint="Leave empty to show “Price on request”.">
                  <PriceInput value={singlePrice} onChange={(v) => { setSinglePrice(v); touch(); }} label="Price" />
                </Field>
              </div>
            ) : (
              <div className="mt-5">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  {colours.length > 0 && sizes.length > 0 ? (
                    <FormControlLabel
                      control={<Switch checked={sameForColours} onChange={(e) => switchSameForColours(e.target.checked)} />}
                      label="All colours cost the same"
                    />
                  ) : <span />}
                  <Button size="small" onClick={() => { const v = window.prompt('Price to put in every empty box (₹):'); if (v && Number(v) > 0) fillEmpty(String(Number(v))); }}>
                    Fill empty prices
                  </Button>
                </div>
                <div className="overflow-x-auto rounded-lg border border-[#14232b]/10">
                  <table className="w-full min-w-[320px] text-sm">
                    <thead className="bg-[#f7f8f9] text-left text-xs uppercase tracking-[0.08em] text-[#4b5b63]">
                      <tr>
                        {sizes.length > 0 && <th className="px-3 py-2 font-semibold">Size</th>}
                        {priceColumns.map((c) => <th key={c || 'price'} className="px-3 py-2 font-semibold">{c || (colours.length && !sizes.length ? 'Colour' : 'Price')}</th>)}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#14232b]/8">
                      {sizes.length > 0 ? priceRows.map((size) => (
                        <tr key={size}>
                          <td className="whitespace-nowrap px-3 py-2 font-medium">{size}</td>
                          {priceColumns.map((c) => (
                            <td key={c || 'price'} className="px-3 py-2">
                              <PriceInput value={prices[cellKey(size, c)] ?? ''} onChange={(v) => setCell(size, c, v)} label={`Price for ${size}${c ? ` ${c}` : ''}`} />
                            </td>
                          ))}
                        </tr>
                      )) : colours.map((colour) => (
                        <tr key={colour}>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-3">
                              <span className="w-24 font-medium">{colour}</span>
                              <PriceInput value={prices[cellKey('', '')] ?? ''} onChange={(v) => setCell('', '', v)} label={`Price for ${colour}`} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-2 text-sm text-[#4b5b63]">
                  {pricedCount === 0
                    ? 'No prices yet: the website shows “Price on request” and customers ask on WhatsApp.'
                    : <>Listed on the website from <strong className="font-mono text-[#14232b]">{formatPrice(listedPrice)}</strong>. {variants.length - pricedCount > 0 && `${variants.length - pricedCount} option${variants.length - pricedCount === 1 ? '' : 's'} show “Price on request”.`}</>}
                </p>
              </div>
            )}
          </Panel>

          {/* Specifications */}
          <Panel
            title="Specifications"
            description="Your own rows, like weights or wheel size. Type the name and the value; switch a row to “Hidden” to keep it for the shop only."
            actions={<Button size="small" onClick={() => { setSpecs((s) => [...s, { specKey: '', specValue: '', showToCustomers: true }]); touch(); }}>Add a row</Button>}
          >
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-[#4b5b63]">Quick add:</span>
              {SPEC_PRESETS.map((preset) => {
                const suggested = preset.match.test(specCategoryText);
                return (
                  <Chip
                    key={preset.label}
                    size="small"
                    label={`+ ${preset.label}`}
                    color={suggested ? 'primary' : 'default'}
                    variant={suggested ? 'filled' : 'outlined'}
                    onClick={() => addSpecPreset(preset.rows.map((r) => r.key))}
                  />
                );
              })}
            </div>
            {specs.length === 0 ? (
              <p className="text-sm text-[#4b5b63]">No specifications yet.</p>
            ) : (
              <div className="space-y-3">
                {specs.map((spec, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                    <TextField size="small" placeholder="Name, e.g. PVC weight" value={spec.specKey} onChange={(e) => setSpec(i, { specKey: e.target.value })} inputProps={{ 'aria-label': 'Specification name' }} sx={{ flex: '1 1 180px' }} />
                    <TextField size="small" placeholder={SPEC_HINTS[spec.specKey] ?? 'Value, e.g. 450 g'} value={spec.specValue} onChange={(e) => setSpec(i, { specValue: e.target.value })} inputProps={{ 'aria-label': 'Specification value' }} sx={{ flex: '1 1 140px' }} />
                    <div className="flex items-center">
                      <Tooltip title={spec.showToCustomers ? 'Shown on the website' : 'Hidden: only you see this row'}>
                        <FormControlLabel
                          sx={{ m: 0 }}
                          control={<Switch size="small" checked={spec.showToCustomers} onChange={(e) => setSpec(i, { showToCustomers: e.target.checked })} />}
                          label={<span className={`w-12 text-right text-xs ${spec.showToCustomers ? 'text-[#4b5b63]' : 'font-semibold text-[#b45309]'}`}>{spec.showToCustomers ? 'Website' : 'Hidden'}</span>}
                          labelPlacement="start"
                        />
                      </Tooltip>
                      <IconButton size="small" onClick={() => { setSpecs((s) => s.filter((_, j) => j !== i)); touch(); }} aria-label="Remove row"><CloseIcon fontSize="small" /></IconButton>
                    </div>
                  </div>
                ))}
                {specs.some((s) => !s.showToCustomers) && (
                  <p className="text-xs text-[#4b5b63]">“Hidden” rows stay in the admin panel and on supplier quotation sheets; customers never see them.</p>
                )}
              </div>
            )}
          </Panel>

          {/* More */}
          <div className="rounded-xl border border-[#14232b]/10 bg-white">
            <button type="button" onClick={() => setShowMore((v) => !v)} className="flex w-full items-center justify-between px-5 py-4 text-left">
              <span>
                <span className="block text-base font-semibold">More settings</span>
                <span className="block text-sm text-[#4b5b63]">Product code, brand, material, Hindi and Gujarati text, search engine text</span>
              </span>
              <ExpandMoreIcon className={`transition-transform ${showMore ? 'rotate-180' : ''}`} />
            </button>
            <Collapse in={showMore}>
              <div className="grid gap-4 border-t border-[#14232b]/8 p-5 sm:grid-cols-2">
                <Field label="Product code" hint={isNew ? 'Leave empty to create one automatically.' : undefined}>
                  <TextField size="small" fullWidth value={form.sku} onChange={(e) => update('sku', e.target.value)} />
                </Field>
                <Field label="Brand"><TextField size="small" fullWidth value={form.brand} onChange={(e) => update('brand', e.target.value)} /></Field>
                <Field label="Material"><TextField size="small" fullWidth value={form.material} onChange={(e) => update('material', e.target.value)} /></Field>
                <Field label="Finish or pattern"><TextField size="small" fullWidth value={form.pattern} onChange={(e) => update('pattern', e.target.value)} /></Field>
                <Field label="Search words" hint="Comma separated, e.g. runner, ripple, silent">
                  <TextField size="small" fullWidth value={form.tags} onChange={(e) => update('tags', e.target.value)} />
                </Field>
                {(['hi', 'gu'] as const).map((lang) => (
                  <div key={lang} className="space-y-3 rounded-lg bg-[#f7f8f9] p-4 sm:col-span-2">
                    <p className="text-sm font-semibold">{lang === 'hi' ? 'Hindi' : 'Gujarati'} text <span className="font-normal text-[#4b5b63]">(optional, English is used when empty)</span></p>
                    <TextField size="small" fullWidth label="Name" value={translations[lang].name} onChange={(e) => { setTranslations((t) => ({ ...t, [lang]: { ...t[lang], name: e.target.value } })); touch(); }} sx={{ bgcolor: 'white' }} />
                    <TextField size="small" fullWidth label="One-line summary" value={translations[lang].shortDescription} onChange={(e) => { setTranslations((t) => ({ ...t, [lang]: { ...t[lang], shortDescription: e.target.value } })); touch(); }} sx={{ bgcolor: 'white' }} />
                    <TextField size="small" fullWidth multiline minRows={2} label="Full description" value={translations[lang].longDescription} onChange={(e) => { setTranslations((t) => ({ ...t, [lang]: { ...t[lang], longDescription: e.target.value } })); touch(); }} sx={{ bgcolor: 'white' }} />
                  </div>
                ))}
                <Field label="Title in Google results"><TextField size="small" fullWidth value={form.metaTitle} onChange={(e) => update('metaTitle', e.target.value)} /></Field>
                <Field label="Description in Google results"><TextField size="small" fullWidth value={form.metaDescription} onChange={(e) => update('metaDescription', e.target.value)} /></Field>
              </div>
            </Collapse>
          </div>

          {!isNew && (
            <div className="rounded-xl border border-[#b3261e]/20 bg-white p-5">
              <p className="font-semibold">Remove this product</p>
              <p className="mt-1 text-sm text-[#4b5b63]">To take it off the website for now, switch off “Show on the website” instead. Deleting removes it and its photos for good.</p>
              <Button color="error" variant="outlined" size="small" className="!mt-3" onClick={() => setDeleteOpen(true)}>Delete product</Button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          <Panel title="On the website">
            <FormControlLabel
              control={<Switch checked={shown} onChange={(e) => update('status', e.target.checked ? 'ACTIVE' : 'DEACTIVATED')} />}
              label={shown ? 'Shown to customers' : 'Hidden from customers'}
            />
            <div className="mt-3 flex flex-col border-t border-[#14232b]/8 pt-3">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#4b5b63]">Labels</p>
              <FormControlLabel control={<Switch size="small" checked={form.isFeatured} onChange={(e) => update('isFeatured', e.target.checked)} />} label="Featured" />
              <FormControlLabel control={<Switch size="small" checked={form.isNewArrival} onChange={(e) => update('isNewArrival', e.target.checked)} />} label="New" />
              <FormControlLabel control={<Switch size="small" checked={form.isBestSeller} onChange={(e) => update('isBestSeller', e.target.checked)} />} label="Best seller" />
            </div>
          </Panel>
          <Panel title="Summary">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-2"><dt className="text-[#4b5b63]">Price</dt><dd className="font-mono">{formatPrice(listedPrice)}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-[#4b5b63]">Sizes</dt><dd>{sizes.length || '–'}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-[#4b5b63]">Colours</dt><dd>{colours.length || '–'}</dd></div>
              <div className="flex justify-between gap-2"><dt className="text-[#4b5b63]">Photos and videos</dt><dd>{realMedia.length + pendingFiles.length || 'None yet'}</dd></div>
            </dl>
          </Panel>
        </aside>
      </div>

      {/* Sticky save bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#14232b]/10 bg-white/95 backdrop-blur md:left-[248px]">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <p className="text-sm text-[#4b5b63]" aria-live="polite">
            {saving ? 'Saving…' : saved ? 'All changes saved.' : dirty ? 'You have unsaved changes.' : isNew ? 'Not saved yet.' : 'No changes.'}
          </p>
          <div className="flex gap-2">
            <Button component={Link} to="/admin/products">{dirty ? 'Discard' : 'Back'}</Button>
            <Button variant="contained" onClick={save} disabled={saving || (!dirty && !isNew)}>
              {saving ? 'Saving…' : isNew ? 'Add product' : 'Save changes'}
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Delete “{form.name}”?</DialogTitle>
        <DialogContent>It will be removed from the website and the admin panel, with its photos and prices. This can't be undone. Hiding it keeps everything.</DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Keep it</Button>
          <Button onClick={() => { setDeleteOpen(false); update('status', 'DEACTIVATED'); }}>Hide instead</Button>
          <Button color="error" variant="contained" onClick={deleteProduct}>Delete</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={blocker.state === 'blocked'} onClose={() => blocker.reset?.()}>
        <DialogTitle>Leave without saving?</DialogTitle>
        <DialogContent>Your changes to this product haven't been saved.</DialogContent>
        <DialogActions>
          <Button onClick={() => blocker.reset?.()}>Stay</Button>
          <Button color="error" onClick={() => blocker.proceed?.()}>Leave</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
