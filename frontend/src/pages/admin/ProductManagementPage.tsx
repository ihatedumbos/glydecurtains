import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, InputAdornment, MenuItem, Skeleton, Switch, TextField, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import axiosInstance from '@/api/axiosInstance';
import { EmptyState, PageHeader, Pill } from '@/components/admin/AdminUi';
import { formatPrice } from '@/utils/price';

interface ProductRow {
  id: number;
  name: string;
  sku: string;
  categoryId?: number | null;
  categoryName?: string | null;
  subCategoryName?: string | null;
  basePrice: number;
  status: 'ACTIVE' | 'ARCHIVED' | 'DEACTIVATED';
  sizes?: string[];
  colors?: string[];
  thumbnailUrl?: string | null;
  imageCount?: number;
  videoCount?: number;
  variantCount?: number;
  updatedAt?: string;
}

interface Category { id: number; name: string; }

type Show = 'all' | 'no-photo' | 'no-price' | 'hidden';

const SHOW_OPTIONS: Array<{ value: Show; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'no-photo', label: 'Need photos' },
  { value: 'no-price', label: 'Price on request' },
  { value: 'hidden', label: 'Hidden' },
];

const hasPrice = (p: ProductRow) => Boolean(p.basePrice && p.basePrice > 0);

function priceLabel(p: ProductRow): string {
  if (!hasPrice(p)) return 'Price on request';
  return (p.variantCount ?? 0) > 1 ? `From ${formatPrice(p.basePrice)}` : formatPrice(p.basePrice);
}

function mediaLabel(p: ProductRow): string {
  const parts = [];
  if (p.imageCount) parts.push(`${p.imageCount} photo${p.imageCount === 1 ? '' : 's'}`);
  if (p.videoCount) parts.push(`${p.videoCount} video${p.videoCount === 1 ? '' : 's'}`);
  return parts.join(' · ');
}

function optionsLabel(p: ProductRow): string {
  const sizes = p.sizes?.length ?? 0;
  const colours = p.colors?.length ?? 0;
  const parts = [];
  if (sizes) parts.push(`${sizes} size${sizes === 1 ? '' : 's'}`);
  if (colours) parts.push(`${colours} colour${colours === 1 ? '' : 's'}`);
  return parts.join(' · ');
}

export default function ProductManagementPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const show = (params.get('show') as Show) || 'all';
  const categoryFilter = params.get('category') || '';
  const [search, setSearch] = useState(params.get('q') || '');
  const [products, setProducts] = useState<ProductRow[] | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [toggling, setToggling] = useState<number | null>(null);

  useEffect(() => {
    axiosInstance.get('/products', { params: { page: 0, size: 500 } })
      .then((res) => setProducts(res.data.data.content ?? []))
      .catch(() => setProducts([]));
    axiosInstance.get('/categories')
      .then((res) => setCategories(res.data.data ?? []))
      .catch(() => setCategories([]));
  }, []);

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value && value !== 'all') next.set(key, value); else next.delete(key);
    setParams(next, { replace: true });
  };

  const counts = useMemo(() => {
    const list = products ?? [];
    return {
      all: list.length,
      'no-photo': list.filter((p) => !p.imageCount).length,
      'no-price': list.filter((p) => !hasPrice(p)).length,
      hidden: list.filter((p) => p.status !== 'ACTIVE').length,
    } as Record<Show, number>;
  }, [products]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (products ?? [])
      .filter((p) => {
        if (show === 'no-photo' && p.imageCount) return false;
        if (show === 'no-price' && hasPrice(p)) return false;
        if (show === 'hidden' && p.status === 'ACTIVE') return false;
        if (categoryFilter && String(p.categoryId) !== categoryFilter) return false;
        if (term && !`${p.name} ${p.sku} ${p.categoryName ?? ''} ${p.subCategoryName ?? ''}`.toLowerCase().includes(term)) return false;
        return true;
      })
      .sort((a, b) => (a.categoryName ?? '').localeCompare(b.categoryName ?? '') || a.name.localeCompare(b.name, undefined, { numeric: true }));
  }, [products, show, categoryFilter, search]);

  const toggleShown = async (product: ProductRow) => {
    setToggling(product.id);
    const action = product.status === 'ACTIVE' ? 'deactivate' : 'activate';
    try {
      const res = await axiosInstance.put(`/products/${product.id}/${action}`);
      const status = res.data.data?.status ?? (action === 'activate' ? 'ACTIVE' : 'DEACTIVATED');
      setProducts((list) => list?.map((p) => (p.id === product.id ? { ...p, status } : p)) ?? null);
    } catch {
      // The request interceptor shows the error.
    } finally {
      setToggling(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle="Everything listed on the website. Open a product to change its photos, sizes, colours and prices."
        actions={<Button component={Link} to="/admin/products/new" variant="contained" startIcon={<AddIcon />}>Add a product</Button>}
      />

      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Filter products">
        {SHOW_OPTIONS.map((option) => {
          const active = show === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setParam('show', option.value)}
              className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
                active ? 'border-[#14232b] bg-[#14232b] text-white' : 'border-[#14232b]/15 bg-white text-[#14232b] hover:border-[#14232b]/40'
              }`}
            >
              {option.label}
              <span className={`ml-1.5 font-mono text-xs ${active ? 'text-white/70' : 'text-[#4b5b63]'}`}>{products ? counts[option.value] : ''}</span>
            </button>
          );
        })}
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <TextField
          size="small"
          placeholder="Search by name or code"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
          sx={{ flex: 1, bgcolor: 'white' }}
        />
        <TextField select size="small" label="Category" value={categoryFilter} onChange={(e) => setParam('category', e.target.value)} sx={{ minWidth: 200, bgcolor: 'white' }}>
          <MenuItem value="">All categories</MenuItem>
          {categories.map((c) => <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>)}
        </TextField>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#14232b]/10 bg-white">
        <div className="hidden grid-cols-[56px_minmax(0,1fr)_150px_170px_96px_24px] gap-x-4 border-b border-[#14232b]/10 bg-[#f7f8f9] px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.08em] text-[#4b5b63] md:grid">
          <span className="col-span-2">Product</span>
          <span>Price</span>
          <span>Photos and options</span>
          <span>On website</span>
          <span />
        </div>

        {!products ? (
          <div className="space-y-2 p-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={56} />)}</div>
        ) : visible.length === 0 ? (
          <div className="p-6">
            <EmptyState title={products.length ? 'No products match' : 'No products yet'}>
              {products.length ? 'Try another filter or search word.' : 'Add your first product to list it on the website.'}
            </EmptyState>
          </div>
        ) : (
          <ul className="divide-y divide-[#14232b]/8">
            {visible.map((product) => {
              const shown = product.status === 'ACTIVE';
              const media = mediaLabel(product);
              const options = optionsLabel(product);
              return (
                <li
                  key={product.id}
                  className={`grid cursor-pointer grid-cols-[56px_minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-4 py-3 transition-colors hover:bg-[#f7f8f9] md:grid-cols-[56px_minmax(0,1fr)_150px_170px_96px_24px] ${shown ? '' : 'bg-[#f7f8f9]/60'}`}
                  onClick={() => navigate(`/admin/products/${product.id}`)}
                >
                  <div className="row-span-3 h-14 w-14 self-start overflow-hidden rounded-lg border border-[#14232b]/10 bg-[#f3f5f6] md:row-span-1 md:self-center">
                    {product.thumbnailUrl && <img src={product.thumbnailUrl} alt="" className="h-full w-full object-cover" loading="lazy" />}
                  </div>
                  <div className="col-start-2 row-start-1 min-w-0">
                    <p className={`truncate font-medium ${shown ? '' : 'text-[#4b5b63]'}`}>{product.name}</p>
                    <p className="truncate text-xs text-[#4b5b63]">
                      {[product.categoryName, product.subCategoryName].filter(Boolean).join(' › ')}
                      <span className="ml-2 font-mono">{product.sku}</span>
                    </p>
                  </div>
                  <div className="col-start-2 text-sm md:col-start-3 md:row-start-1">
                    {hasPrice(product) ? <span className="font-mono">{priceLabel(product)}</span> : <Pill tone="attention">Price on request</Pill>}
                  </div>
                  <div className="col-start-2 flex flex-wrap gap-x-2 gap-y-1 text-xs text-[#4b5b63] md:col-start-4 md:row-start-1">
                    {media ? <span>{media}</span> : <Pill tone="attention">No photo yet</Pill>}
                    {options && <span>{options}</span>}
                  </div>
                  <div className="col-start-3 row-start-1 md:col-start-5" onClick={(e) => e.stopPropagation()}>
                    <Tooltip title={shown ? 'Shown on the website. Switch off to hide it.' : 'Hidden from the website. Switch on to show it.'}>
                      <Switch
                        checked={shown}
                        disabled={toggling === product.id}
                        onChange={() => toggleShown(product)}
                        inputProps={{ 'aria-label': `Show ${product.name} on the website` }}
                      />
                    </Tooltip>
                  </div>
                  <ChevronRightIcon className="hidden text-[#4b5b63] md:col-start-6 md:row-start-1 md:block" />
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {products && visible.length > 0 && (
        <p className="mt-3 text-sm text-[#4b5b63]">
          Showing {visible.length} of {products.length} products. Hidden products stay in the admin panel but customers can't see them.
        </p>
      )}
    </div>
  );
}
