import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Pagination,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  Grid,
  Skeleton,
  Breadcrumbs,
  Link,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import HomeIcon from '@mui/icons-material/Home';
import StoreIcon from '@mui/icons-material/Store';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { Link as RouterLink } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
  setStores,
  setSearchResults,
  setStoreLoading,
  setStoreError,
  type StoreLocation,
} from '@/store/slices/storeLocatorSlice';
import axiosInstance from '@/api/axiosInstance';

export default function StoreLocatorPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const dispatch = useAppDispatch();

  const { stores, searchResults, pagination, loading } = useAppSelector(
    (state) => state.storeLocator,
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [isSearchMode, setIsSearchMode] = useState(false);

  // Fetch paginated stores
  const fetchStores = useCallback(async () => {
    dispatch(setStoreLoading(true));
    dispatch(setStoreError(null));
    try {
      const res = await axiosInstance.get('/stores', {
        params: { page: page - 1, size: 20 },
      });
      const data = res.data?.data || res.data;
      dispatch(
        setStores({
          content: data.content || [],
          totalElements: data.totalElements || 0,
          totalPages: data.totalPages || 0,
          page: data.number ?? page - 1,
        }),
      );
    } catch {
      dispatch(setStoreError('Failed to load stores'));
      dispatch(setStores({ content: [], totalElements: 0, totalPages: 0, page: 0 }));
    } finally {
      dispatch(setStoreLoading(false));
    }
  }, [dispatch, page]);

  // Search stores by city/area
  const searchStores = useCallback(
    async (query: string) => {
      dispatch(setStoreLoading(true));
      dispatch(setStoreError(null));
      try {
        const res = await axiosInstance.get('/stores/search', {
          params: { query },
        });
        const data = res.data?.data || res.data || [];
        dispatch(setSearchResults(Array.isArray(data) ? data : data.content || []));
      } catch {
        dispatch(setStoreError('Failed to search stores'));
        dispatch(setSearchResults([]));
      } finally {
        dispatch(setStoreLoading(false));
      }
    },
    [dispatch],
  );

  useEffect(() => {
    if (!isSearchMode) {
      fetchStores();
    }
  }, [fetchStores, isSearchMode]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (value.trim().length === 0) {
      setIsSearchMode(false);
      dispatch(setSearchResults([]));
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed.length > 0) {
      setIsSearchMode(true);
      searchStores(trimmed);
    } else {
      setIsSearchMode(false);
    }
  };

  const handlePageChange = (_event: React.ChangeEvent<unknown>, newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const displayedStores: StoreLocation[] = isSearchMode ? searchResults : stores;

  // Format operating hours for display
  const formatOperatingHours = (hours?: Record<string, string>) => {
    if (!hours || Object.keys(hours).length === 0) return null;
    return Object.entries(hours).map(([day, time]) => (
      <Typography key={day} variant="body2" color="text.secondary">
        {day}: {time}
      </Typography>
    ));
  };

  // Skeleton cards for loading state
  const renderSkeletons = () => (
    <Grid container spacing={2}>
      {Array.from({ length: 6 }).map((_, idx) => (
        <Grid item xs={12} sm={6} md={4} key={idx}>
          <Card variant="outlined">
            <CardContent>
              <Skeleton variant="text" width="60%" height={32} />
              <Skeleton variant="text" width="80%" />
              <Skeleton variant="text" width="50%" />
              <Skeleton variant="text" width="70%" />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          component={RouterLink}
          to="/"
          underline="hover"
          color="inherit"
          sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
        >
          <HomeIcon fontSize="small" />
          Home
        </Link>
        <Typography color="text.primary">Store Locator</Typography>
      </Breadcrumbs>

      {/* Page Title */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <StoreIcon color="primary" />
        <Typography variant="h4" component="h1" fontWeight={700}>
          Store Locator
        </Typography>
      </Box>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Find a Glyde Curtains store near you
      </Typography>

      {/* Search Bar */}
      <Box component="form" onSubmit={handleSearchSubmit} sx={{ mb: 3, maxWidth: 480 }}>
        <TextField
          fullWidth
          placeholder="Search by city or area..."
          value={searchQuery}
          onChange={handleSearchChange}
          size={isMobile ? 'small' : 'medium'}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Results count */}
      {!loading && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {isSearchMode
            ? `${searchResults.length} store${searchResults.length !== 1 ? 's' : ''} found`
            : `${pagination.totalElements} store${pagination.totalElements !== 1 ? 's' : ''} available`}
        </Typography>
      )}

      {/* Store List */}
      {loading ? (
        renderSkeletons()
      ) : displayedStores.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <StoreIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No stores found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {isSearchMode
              ? 'Try searching with a different city or area name'
              : 'No stores are currently available'}
          </Typography>
        </Box>
      ) : (
        <>
          <Grid container spacing={2}>
            {displayedStores.map((store) => (
              <Grid item xs={12} sm={6} md={4} key={store.id}>
                <Card
                  variant="outlined"
                  sx={{
                    height: '100%',
                    transition: 'box-shadow 0.2s',
                    '&:hover': { boxShadow: 3 },
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      {store.name}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 1 }}>
                      <LocationOnIcon fontSize="small" color="action" sx={{ mt: 0.3 }} />
                      <Typography variant="body2" color="text.secondary">
                        {store.address}, {store.city}, {store.state}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <PhoneIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {store.phone}
                      </Typography>
                    </Box>

                    {store.email && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <EmailIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {store.email}
                        </Typography>
                      </Box>
                    )}

                    {store.operatingHours &&
                      Object.keys(store.operatingHours).length > 0 && (
                        <Box sx={{ mt: 1.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <AccessTimeIcon fontSize="small" color="action" />
                            <Typography variant="body2" fontWeight={500}>
                              Operating Hours
                            </Typography>
                          </Box>
                          <Box sx={{ pl: 3.5 }}>
                            {formatOperatingHours(store.operatingHours)}
                          </Box>
                        </Box>
                      )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Pagination - only show in non-search mode */}
          {!isSearchMode && pagination.totalPages > 1 && (
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
    </Container>
  );
}
