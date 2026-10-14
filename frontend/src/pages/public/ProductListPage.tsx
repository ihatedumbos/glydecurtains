import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Pagination,
  Drawer,
  IconButton,
  useMediaQuery,
  useTheme,
  Button,
  Breadcrumbs,
  Link,
  Chip,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';
import HomeIcon from '@mui/icons-material/Home';
import { useSearchParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setProducts, setProductLoading, type ProductFilters } from '@/store/slices/productSlice';
import { setSuggestions, setRecentSearches } from '@/store/slices/searchSlice';
import axiosInstance from '@/api/axiosInstance';
import ProductCard from '@/components/product/ProductCard';
import ProductCardSkeleton from '@/components/product/ProductCardSkeleton';
import ProductFilterSidebar from '@/components/product/ProductFilterSidebar';
import ProductSearchBar from '@/components/product/ProductSearchBar';
import ProductSortDropdown from '@/components/product/ProductSortDropdown';

// Filter option types
interface FilterOption {
  id: number | string;
  name: string;
}

// Sidebar drawer width
const DRAWER_WIDTH = 280;
const PAGE_SIZE = 20;
const DEFAULT_SORT = 'popularity';

const toNumber = (value: string | null) => {
  if (value === null || value.trim() === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

const toList = (value: string | null) => {
  const list = (value || '').split(',').map((v) => v.trim()).filter(Boolean);
  return list.length ? list : undefined;
};

/**
 * The URL is the single source of truth for filters, sort, search text and page, so
 * links like /products?categoryId=3 work, filtered views can be shared or bookmarked,
 * and the browser back button steps through filter changes.
 */
function readFilters(params: URLSearchParams): ProductFilters {
  return {
    categoryId: toNumber(params.get('categoryId')),
    subCategoryId: toNumber(params.get('subCategoryId')),
    collectionId: toNumber(params.get('collectionId')),
    colors: toList(params.get('colors')),
    sizes: toList(params.get('sizes')),
    materials: toList(params.get('materials')),
    minPrice: toNumber(params.get('minPrice')),
    maxPrice: toNumber(params.get('maxPrice')),
    inStock: params.get('inStock') === 'true' || undefined,
  };
}

function writeFilters(filters: ProductFilters, params: URLSearchParams) {
  const set = (key: string, value: string | number | boolean | undefined) => {
    if (value === undefined || value === '' || value === false) params.delete(key);
    else params.set(key, String(value));
  };
  set('categoryId', filters.categoryId);
  set('subCategoryId', filters.subCategoryId);
  set('collectionId', filters.collectionId);
  set('colors', filters.colors?.join(','));
  set('sizes', filters.sizes?.join(','));
  set('materials', filters.materials?.join(','));
  set('minPrice', filters.minPrice);
  set('maxPrice', filters.maxPrice);
  set('inStock', filters.inStock);
}

export default function ProductListPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Redux state
  const { list: products, pagination, loading } = useAppSelector((state) => state.products);
  const { suggestions } = useAppSelector((state) => state.search);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  // Everything that changes the result list is derived from the URL.
  const searchKey = searchParams.toString();
  const filters = useMemo(() => readFilters(new URLSearchParams(searchKey)), [searchKey]);
  const query = searchParams.get('q')?.trim() || '';
  // With a search term and no explicit choice, rank by how well products match it.
  const sortBy = searchParams.get('sort') || (query ? 'relevance' : DEFAULT_SORT);
  const page = Math.max(1, toNumber(searchParams.get('page')) || 1);

  // Local state
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Filter metadata (loaded from API)
  const [categories, setCategories] = useState<FilterOption[]>([]);
  const [subCategories, setSubCategories] = useState<FilterOption[]>([]);
  // Colour/size/material options come from the catalogue itself, so every option matches something.
  const [colors, setColors] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [materials, setMaterials] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [collections, setCollections] = useState<FilterOption[]>([]);

  /** Applies URL changes; any change other than paging returns to page 1. */
  const updateParams = useCallback(
    (mutate: (params: URLSearchParams) => void, keepPage = false) => {
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        mutate(next);
        if (!keepPage) next.delete('page');
        return next;
      });
    },
    [setSearchParams],
  );

  // Load categories and collections on mount
  useEffect(() => {
    const fetchFilterMeta = async () => {
      try {
        const [catRes, colRes, facetRes] = await Promise.allSettled([
          axiosInstance.get('/categories/public/tree', { params: { listedOnly: true } }),
          axiosInstance.get('/collections/public'),
          axiosInstance.get('/search/facets'),
        ]);
        // Each request is independent: one failing shouldn't hide the other filter groups.
        if (catRes.status === 'fulfilled') {
          const catData = catRes.value.data?.data || catRes.value.data || [];
          setCategories(catData.map((c: { id: number; name: string }) => ({ id: c.id, name: c.name })));
        }
        if (colRes.status === 'fulfilled') {
          const colData = colRes.value.data?.data || colRes.value.data || [];
          setCollections(colData.map((c: { id: number; name: string }) => ({ id: c.id, name: c.name })));
        }
        if (facetRes.status === 'fulfilled') {
          const facets = facetRes.value.data?.data || {};
          setColors(facets.colors || []);
          setSizes(facets.sizes || []);
          setMaterials(facets.materials || []);
          if (facets.maxPrice) setMaxPrice(Number(facets.maxPrice));
        }
      } catch {
        // Silently handle - filters will remain empty
      }
    };
    fetchFilterMeta();
  }, []);

  // Load sub-categories when category filter changes
  useEffect(() => {
    if (filters.categoryId) {
      const fetchSubCats = async () => {
        try {
          // Same trimmed tree as the category list, so only sub-categories with products show.
          const res = await axiosInstance.get('/categories/public/tree', { params: { listedOnly: true } });
          const tree: { id: number; subCategories?: { id: number; name: string }[] }[] = res.data?.data || res.data || [];
          const data = tree.find((c) => c.id === filters.categoryId)?.subCategories || [];
          setSubCategories(data.map((s) => ({ id: s.id, name: s.name })));
        } catch {
          setSubCategories([]);
        }
      };
      fetchSubCats();
    } else {
      setSubCategories([]);
    }
  }, [filters.categoryId]);

  // Load recent searches for authenticated users
  useEffect(() => {
    if (isAuthenticated) {
      const fetchRecent = async () => {
        try {
          const res = await axiosInstance.get('/search/recent');
          const data = res.data?.data || res.data || [];
          dispatch(setRecentSearches(data));
        } catch {
          // Silent fail
        }
      };
      fetchRecent();
    }
  }, [isAuthenticated, dispatch]);

  // Fetch products whenever the URL changes. Every listing goes through /search/products
  // so sorting and filtering behave the same with or without a category or search term.
  useEffect(() => {
    const controller = new AbortController();
    const params: Record<string, string | number | boolean | undefined> = {
      page: page - 1, // Backend is 0-indexed
      size: PAGE_SIZE,
      sortBy,
      query: query || undefined,
      categoryId: filters.categoryId,
      subCategoryId: filters.subCategoryId,
      collectionId: filters.collectionId,
      colors: filters.colors?.join(','),
      sizes: filters.sizes?.join(','),
      materials: filters.materials?.join(','),
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      inStock: filters.inStock,
    };
    const cleanParams = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined));

    dispatch(setProductLoading(true));
    axiosInstance
      .get('/search/products', { params: cleanParams, signal: controller.signal })
      .then((res) => {
        const data = res.data?.data || res.data;
        dispatch(
          setProducts({
            content: data.content || [],
            totalElements: data.totalElements || 0,
            totalPages: data.totalPages || 0,
            page: data.number ?? page - 1,
          }),
        );
        dispatch(setProductLoading(false));
      })
      .catch(() => {
        // A newer request replaced this one; let it own the loading state.
        if (controller.signal.aborted) return;
        dispatch(setProducts({ content: [], totalElements: 0, totalPages: 0, page: 0 }));
        dispatch(setProductLoading(false));
      });

    return () => controller.abort();
  }, [dispatch, page, sortBy, query, filters]);

  // Handlers
  const handleFilterChange = (newFilters: ProductFilters) => {
    updateParams((params) => writeFilters(newFilters, params));
  };

  const handleSortChange = (newSort: string) => {
    updateParams((params) => params.set('sort', newSort));
  };

  const handleSearch = (searchQuery: string) => {
    updateParams((params) => {
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      else params.delete('q');
      // Let the default (relevance when searching) apply to the new search.
      params.delete('sort');
    });
  };

  const handleFetchSuggestions = async (q: string) => {
    try {
      const res = await axiosInstance.get('/search/autocomplete', { params: { query: q } });
      const data = res.data?.data || res.data || [];
      dispatch(setSuggestions(data));
    } catch {
      dispatch(setSuggestions([]));
    }
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, newPage: number) => {
    updateParams((params) => {
      if (newPage > 1) params.set('page', String(newPage));
      else params.delete('page');
    }, true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  // Active filter chips
  const activeFilterChips: { label: string; onDelete: () => void }[] = [];
  if (filters.categoryId) {
    const cat = categories.find((c) => c.id === filters.categoryId);
    if (cat) activeFilterChips.push({ label: cat.name, onDelete: () => handleFilterChange({ ...filters, categoryId: undefined }) });
  }
  if (filters.subCategoryId) {
    const sub = subCategories.find((s) => s.id === filters.subCategoryId);
    if (sub) activeFilterChips.push({ label: sub.name, onDelete: () => handleFilterChange({ ...filters, subCategoryId: undefined }) });
  }
  if (filters.collectionId) {
    const col = collections.find((c) => c.id === filters.collectionId);
    if (col) activeFilterChips.push({ label: col.name, onDelete: () => handleFilterChange({ ...filters, collectionId: undefined }) });
  }
  if (filters.colors?.length) {
    filters.colors.forEach((color) => {
      activeFilterChips.push({ label: color, onDelete: () => {
        const updated = filters.colors!.filter((c) => c !== color);
        handleFilterChange({ ...filters, colors: updated.length ? updated : undefined });
      }});
    });
  }
  if (filters.sizes?.length) {
    filters.sizes.forEach((size) => {
      activeFilterChips.push({ label: size, onDelete: () => {
        const updated = filters.sizes!.filter((s) => s !== size);
        handleFilterChange({ ...filters, sizes: updated.length ? updated : undefined });
      }});
    });
  }
  if (filters.materials?.length) {
    filters.materials.forEach((material) => {
      activeFilterChips.push({ label: material, onDelete: () => {
        const updated = filters.materials!.filter((m) => m !== material);
        handleFilterChange({ ...filters, materials: updated.length ? updated : undefined });
      }});
    });
  }
  if (filters.inStock) {
    activeFilterChips.push({ label: 'In stock', onDelete: () => handleFilterChange({ ...filters, inStock: undefined }) });
  }
  if (filters.minPrice || filters.maxPrice) {
    activeFilterChips.push({
      label: `₹${(filters.minPrice || 0).toLocaleString('en-IN')} - ${filters.maxPrice ? `₹${filters.maxPrice.toLocaleString('en-IN')}` : 'max'}`,
      onDelete: () => handleFilterChange({ ...filters, minPrice: undefined, maxPrice: undefined }),
    });
  }

  const handleClearAllFilters = () => {
    handleFilterChange({});
  };

  // Skeleton grid
  const renderSkeletons = () => (
    <Grid container spacing={2}>
      {Array.from({ length: 8 }).map((_, idx) => (
        <Grid item xs={12} sm={6} md={4} lg={3} key={idx}>
          <ProductCardSkeleton />
        </Grid>
      ))}
    </Grid>
  );

  // Filter sidebar content
  const filterContent = (
    <ProductFilterSidebar
      filters={filters}
      onFilterChange={handleFilterChange}
      categories={categories}
      subCategories={subCategories}
      colors={colors}
      sizes={sizes}
      materials={materials}
      collections={collections}
      maxPrice={maxPrice}
    />
  );

  return (
    <Container maxWidth="xl" sx={{ py: 3, color: 'text.primary' }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component={RouterLink} to="/" underline="hover" color="inherit" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <HomeIcon fontSize="small" />
          Home
        </Link>
        <Typography color="text.primary">Products</Typography>
      </Breadcrumbs>

      {/* Header section: Search + Sort */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          alignItems: { sm: 'center' },
          mb: 3,
        }}
      >
        <ProductSearchBar
          value={query}
          onSearch={handleSearch}
          suggestions={suggestions}
          onFetchSuggestions={handleFetchSuggestions}
        />
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', ml: { sm: 'auto' } }}>
          {isMobile && (
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={() => setMobileFilterOpen(true)}
              size="small"
            >
              Filters
            </Button>
          )}
          <ProductSortDropdown value={sortBy} onChange={handleSortChange} showRelevance={Boolean(query)} />
        </Box>
      </Box>

      {/* Active filter chips */}
      {activeFilterChips.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mb: 2 }}>
          {activeFilterChips.map((chip, idx) => (
            <Chip key={idx} label={chip.label} onDelete={chip.onDelete} size="small" />
          ))}
          <Button size="small" color="error" onClick={handleClearAllFilters}>
            Clear All
          </Button>
        </Box>
      )}

      {/* Result count */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {loading ? 'Loading...' : `${pagination.totalElements} product${pagination.totalElements !== 1 ? 's' : ''} found`}
      </Typography>

      {/* Main content: sidebar + grid */}
      <Box sx={{ display: 'flex', gap: 3 }}>
        {/* Desktop filter sidebar */}
        {!isMobile && (
          <Box
            sx={{
              width: DRAWER_WIDTH,
              flexShrink: 0,
              position: 'sticky',
              top: 80,
              alignSelf: 'flex-start',
              maxHeight: 'calc(100vh - 100px)',
              overflowY: 'auto',
            }}
          >
            {filterContent}
          </Box>
        )}

        {/* Product grid */}
        <Box sx={{ flexGrow: 1 }}>
          {loading ? (
            renderSkeletons()
          ) : products.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography variant="h6" color="text.primary">
                No products found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Try adjusting your filters or search query
              </Typography>
            </Box>
          ) : (
            <>
              <Grid container spacing={2}>
                {products.map((product) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                    <ProductCard
                      product={product}
                      onClick={(p) => navigate(`/products/${p.id}`)}
                     
                    />
                  </Grid>
                ))}
              </Grid>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <Pagination
                    count={pagination.totalPages}
                    page={page}
                    onChange={handlePageChange}
                    color="primary"
                    size={isMobile ? 'small' : 'medium'}
                    showFirstButton
                    showLastButton
                  />
                </Box>
              )}
            </>
          )}
        </Box>
      </Box>

      {/* Mobile filter drawer */}
      <Drawer
        anchor="left"
        open={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        PaperProps={{ sx: { width: DRAWER_WIDTH, p: 2 } }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Filters</Typography>
          <IconButton onClick={() => setMobileFilterOpen(false)} aria-label="Close filters">
            <CloseIcon />
          </IconButton>
        </Box>
        {filterContent}
      </Drawer>
    </Container>
  );
}
