import { useEffect, useState } from 'react';
import { Box, Container, Grid, Typography, Breadcrumbs, Link, Chip } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import { Link as RouterLink, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axiosInstance from '@/api/axiosInstance';
import ProductCard from '@/components/product/ProductCard';
import type { Product } from '@/store/slices/productSlice';
import { addCartItem } from '@/store/slices/cartSlice';
import { addToast } from '@/store/slices/uiSlice';
import { useAppDispatch } from '@/store/hooks';

export default function CategoryPage() {
  const { slug, subSlug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  // Some links (e.g. the product detail breadcrumb) pass the sub-category as a
  // `?sub=` query param instead of a path segment - support both.
  const effectiveSubSlug = subSlug || searchParams.get('sub') || undefined;
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryName, setCategoryName] = useState('Category');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchCategoryProducts = async () => {
      try {
        setLoading(true);

        let categoryId: number | undefined;
        let subCategoryId: number | undefined;

        const treeRes = await axiosInstance.get('/categories/public/tree');
        const tree = treeRes.data?.data || treeRes.data || [];

        const category = tree.find((item: any) =>
          item.slug === slug ||
          item.name?.toLowerCase().replace(/\s+/g, '-') === slug ||
          String(item.id) === slug,
        );

        if (category) {
          categoryId = category.id;
          setCategoryName(category.name);

          if (effectiveSubSlug) {
            const subCategory = (category.subCategories || []).find(
              (item: any) =>
                item.slug === effectiveSubSlug ||
                item.name?.toLowerCase().replace(/\s+/g, '-') === effectiveSubSlug ||
                String(item.id) === effectiveSubSlug,
            );
            subCategoryId = subCategory?.id;
            if (subCategory) setCategoryName(subCategory.name);
          }
        }

        const params: Record<string, string | number | undefined> = {
          page: 0,
          size: 12,
          categoryId,
          subCategoryId,
        };

        const res = await axiosInstance.get('/search/products', { params });
        const data = res.data?.data || res.data || { content: [] };

        if (active) {
          setProducts(data.content || []);
        }
      } catch {
        if (active) setProducts([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchCategoryProducts();

    return () => {
      active = false;
    };
  }, [slug, effectiveSubSlug]);

  const handleAddToCart = async (product: Product, variant: { id: number } | null) => {
    try {
      await dispatch(addCartItem({ productId: product.id, variantId: variant?.id, quantity: 1 })).unwrap();
      dispatch(addToast({ id: `cart-add-${Date.now()}`, type: 'success', message: `${product.name} added to cart` }));
    } catch (err) {
      dispatch(
        addToast({
          id: `cart-add-error-${Date.now()}`,
          type: 'error',
          message: typeof err === 'string' ? err : 'Failed to add item to cart',
        }),
      );
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Breadcrumbs sx={{ mb: 3 }} aria-label="breadcrumb">
        <Link component={RouterLink} to="/" underline="hover" color="inherit" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <HomeIcon fontSize="small" />
          Home
        </Link>
        <Typography color="text.primary">{categoryName}</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="h4" fontWeight={700}>
          {categoryName}
        </Typography>
        <Chip label={loading ? 'Loading…' : `${products.length} items`} color="primary" variant="outlined" />
      </Box>

      {loading ? (
        <Typography color="text.secondary">Loading products…</Typography>
      ) : products.length === 0 ? (
        <Box sx={{ p: 4, borderRadius: 3, background: 'rgba(17, 24, 39, 0.03)', border: '1px solid rgba(148, 163, 184, 0.2)' }}>
          <Typography variant="h6" gutterBottom>
            No products in this category yet.
          </Typography>
          <Typography color="text.secondary">
            Try another category or browse the curated collection from the home page.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2.5}>
          {products.map((product) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
              <ProductCard product={product} onClick={(p) => navigate(`/products/${p.id}`)} onAddToCart={handleAddToCart} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
