import { useEffect, useState } from 'react';
import { Box, Button, Container, Grid, Typography, Breadcrumbs, Link, Chip } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import { Link as RouterLink, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axiosInstance from '@/api/axiosInstance';
import ProductCard from '@/components/product/ProductCard';
import type { Product } from '@/store/slices/productSlice';
import { usePageMeta } from '@/hooks/usePageMeta';

interface CategoryNode {
  id: number;
  name: string;
  slug?: string;
  subCategories?: CategoryNode[];
}

export default function CategoryPage() {
  const { slug, subSlug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  // Some links (e.g. the product detail breadcrumb) pass the sub-category as a
  // `?sub=` query param instead of a path segment - support both.
  const effectiveSubSlug = subSlug || searchParams.get('sub') || undefined;
  const [products, setProducts] = useState<Product[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  // Query string for the full, filterable listing of this category.
  const [listingQuery, setListingQuery] = useState('');
  const [categoryName, setCategoryName] = useState('Category');
  const [loading, setLoading] = useState(true);
  usePageMeta(loading ? undefined : categoryName);

  useEffect(() => {
    let active = true;

    const fetchCategoryProducts = async () => {
      try {
        setLoading(true);

        let categoryId: number | undefined;
        let subCategoryId: number | undefined;

        const treeRes = await axiosInstance.get('/categories/public/tree');
        const tree: CategoryNode[] = treeRes.data?.data || treeRes.data || [];

        const category = tree.find((item: CategoryNode) =>
          item.slug === slug ||
          item.name?.toLowerCase().replace(/\s+/g, '-') === slug ||
          String(item.id) === slug,
        );

        if (category) {
          categoryId = category.id;
          setCategoryName(category.name);

          if (effectiveSubSlug) {
            const subCategory = (category.subCategories || []).find(
              (item: CategoryNode) =>
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
        const listing = new URLSearchParams();
        if (categoryId !== undefined) listing.set('categoryId', String(categoryId));
        if (subCategoryId !== undefined) listing.set('subCategoryId', String(subCategoryId));

        const res = await axiosInstance.get('/search/products', { params });
        const data = res.data?.data || res.data || { content: [] };

        if (active) {
          setProducts(data.content || []);
          setTotalElements(data.totalElements ?? (data.content || []).length);
          setListingQuery(listing.toString());
        }
      } catch {
        if (active) {
          setProducts([]);
          setTotalElements(0);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchCategoryProducts();

    return () => {
      active = false;
    };
  }, [slug, effectiveSubSlug]);


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
        <Chip label={loading ? 'Loading…' : `${totalElements} items`} color="primary" variant="outlined" />
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
              <ProductCard product={product} onClick={(p) => navigate(`/products/${p.id}`)} />
            </Grid>
          ))}
        </Grid>
      )}

      {!loading && totalElements > products.length && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Button variant="outlined" onClick={() => navigate(`/products?${listingQuery}`)}>
            View all {totalElements} products with filters
          </Button>
        </Box>
      )}
    </Container>
  );
}
