import { useState, useEffect, useCallback } from 'react';
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
import { useSearchParams, Link as RouterLink } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setProducts, setFilters, setProductLoading, type ProductFilters } from '@/store/slices/productSlice';
import { setQuery, setSuggestions, setRecentSearches } from '@/store/slices/searchSlice';
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

export default function ProductListPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  // Redux state
  const { list: products, filters, pagination, loading } = useAppSelector((state) => state.products);
  const { query, suggestions } = useAppSelector((state) => state.search);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  // Local state
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'popularity');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  // Filter metadata (loaded from API)
  const [categories, setCategories] = useState<FilterOption[]>([]);
  const [subCategories, setSubCategories] = useState<FilterOption[]>([]);
  const [colors] = useState<string[]>(['White', 'Cream', 'Beige', 'Grey', 'Black', 'Blue', 'Green', 'Red', 'Brown', 'Gold']);
  const [sizes] = useState<string[]>(['Small', 'Medium', 'Large', 'Extra Large', 'Custom']);
  const [materials] = useState<string[]>(['Cotton', 'Polyester', 'Silk', 'Velvet', 'Linen', 'Sheer', 'Aluminium', 'Stainless Steel']);
  const [collections, setCollections] = useState<FilterOption[]>([]);

  // Load categories and collections on mount
  useEffect(() => {
    const fetchFilterMeta = async () => {
      try {
        const [catRes, colRes] = await Promise.all([
          axiosInstance.get('/categories/public/tree'),
          axiosInstance.get('/collections/public'),
        ]);
        const catData = catRes.data?.data || catRes.data || [];
        const colData = colRes.data?.data || colRes.data || [];
        setCategories(catData.map((c: { id: number; name: string }) => ({ id: c.id, name: c.name })));
        setCollections(colData.map((c: { id: number; name: string }) => ({ id: c.id, name: c.name })));
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
          const res = await axiosInstance.get(`/categories/public/${filters.categoryId}/sub-categories`);
          const data = res.data?.data || res.data || [];
          setSubCategories(data.map((s: { id: number; name: string }) => ({ id: s.id, name: s.name })));
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

  // Fetch products based on filters, sort, page, query
  const fetchProducts = useCallback(async () => {
    dispatch(setProductLoading(true));
    try {
      const shouldUseSearchEndpoint =
        Boolean(query?.trim()) ||
        filters.categoryId !== undefined ||
        filters.subCategoryId !== undefined ||
        filters.collectionId !== undefined;

      // The two backend endpoints accept sorting differently:
      // - /search/products (SearchRequest) takes a single `sortBy` string: popularity|newest|price_asc|price_desc|featured
      // - /products/public (Spring Pageable) takes a `sort` param as "field,direction" and has no popularity concept
      const publicSortMap: Record<string, string | undefined> = {
        popularity: undefined,
        newest: 'createdAt,desc',
        price_asc: 'basePrice,asc',
        price_desc: 'basePrice,desc',
        featured: 'isFeatured,desc',
      };

      const params: Record<string, string | number | undefined> = {
        page: page - 1, // Backend is 0-indexed
        size: 20,
        sortBy: shouldUseSearchEndpoint ? sortBy : undefined,
        sort: shouldUseSearchEndpoint ? undefined : publicSortMap[sortBy],
        query: query?.trim() || undefined,
        categoryId: filters.categoryId,
        subCategoryId: filters.subCategoryId,
        collectionId: filters.collectionId,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        // Backend only supports a single color/material value per request today,
        // so we send the first selected chip from each multi-select filter group.
        // NOTE: a product "size" filter can't be wired here - the backend binds both
        // Pageable's page-size and ProductFilterRequest/SearchRequest's size filter field
        // to the same `size` query param, so they'd collide. Needs a backend param rename.
        color: filters.colors?.[0],
        material: filters.materials?.[0],
      };

      // Remove undefined params
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined),
      );

      const res = shouldUseSearchEndpoint
        ? await axiosInstance.get('/search/products', { params: cleanParams })
        : await axiosInstance.get('/products/public', { params: cleanParams });
      const data = res.data?.data || res.data;

      dispatch(
        setProducts({
          content: data.content || [],
          totalElements: data.totalElements || 0,
          totalPages: data.totalPages || 0,
          page: data.number ?? page - 1,
        }),
      );
    } catch {
      dispatch(
        setProducts({ content: [], totalElements: 0, totalPages: 0, page: 0 }),
      );
    } finally {
      dispatch(setProductLoading(false));
    }
  }, [dispatch, page, sortBy, query, filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Sync URL params
  useEffect(() => {
    const params: Record<string, string> = {};
    if (page > 1) params.page = String(page);
    if (sortBy !== 'popularity') params.sort = sortBy;
    if (query) params.q = query;
    setSearchParams(params, { replace: true });
  }, [page, sortBy, query, setSearchParams]);

  // Handlers
  const handleFilterChange = (newFilters: ProductFilters) => {
    dispatch(setFilters(newFilters));
    setPage(1);
  };

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    setPage(1);
  };

  const handleSearch = (searchQuery: string) => {
    dispatch(setQuery(searchQuery));
    setPage(1);
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
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Active filter chips
  const activeFilterChips: { label: string; onDelete: () => void }[] = [];
  if (filters.categoryId) {
    const cat = categories.find((c) => c.id === filters.categoryId);
    if (cat) activeFilterChips.push({ label: cat.name, onDelete: () => handleFilterChange({ ...filters, categoryId: undefined }) });
  }
  if (filters.colors?.length) {
    filters.colors.forEach((color) => {
      activeFilterChips.push({ label: color, onDelete: () => {
        const updated = filters.colors!.filter((c) => c !== color);
        handleFilterChange({ ...filters, colors: updated.length ? updated : undefined });
      }});
    });
  }
  if (filters.minPrice || filters.maxPrice) {
    activeFilterChips.push({
      label: `₹${filters.minPrice || 0} - ₹${filters.maxPrice || '50,000'}`,
      onDelete: () => handleFilterChange({ ...filters, minPrice: undefined, maxPrice: undefined }),
    });
  }

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
          onChange={(q) => dispatch(setQuery(q))}
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
          <ProductSortDropdown value={sortBy} onChange={handleSortChange} />
        </Box>
      </Box>

      {/* Active filter chips */}
      {activeFilterChips.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {activeFilterChips.map((chip, idx) => (
            <Chip key={idx} label={chip.label} onDelete={chip.onDelete} size="small" />
          ))}
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
                    <RouterLink to={`/products/${product.id}`} style={{ textDecoration: 'none' }}>
                      <ProductCard product={product} />
                    </RouterLink>
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
