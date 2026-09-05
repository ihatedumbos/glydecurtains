import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Grid from '@mui/material/Grid2';
import { useParams, Link } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Chip,
  Rating,
  Skeleton,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
  Avatar,
  Card,
  CardMedia,
  CardContent,
  CardActionArea,
  Alert,
} from '@mui/material';
import Breadcrumb, { BreadcrumbItem } from '@/components/layout/Breadcrumb';
import axiosInstance from '@/api/axiosInstance';
import { resolveMediaUrl } from '@/utils/mediaUrl';

// ─── Types ──────────────────────────────────────────────────────────────────

interface ProductImage {
  id: number;
  base64Data: string;
  mimeType: string;
  originalFilename: string;
  isThumbnail: boolean;
  sortOrder: number;
  mediaType?: 'IMAGE' | 'VIDEO';
}

interface ProductSpecification {
  id: number;
  specKey: string;
  specValue: string;
  sortOrder: number;
}

interface ProductVariant {
  id: number;
  material?: string;
  size?: string;
  color?: string;
  price: number;
  stockQuantity: number;
}

interface Category {
  id: number;
  name: string;
}

interface SubCategory {
  id: number;
  name: string;
}

interface ProductDetail {
  id: number;
  name: string;
  sku: string;
  barcode?: string;
  shortDescription?: string;
  longDescription?: string;
  categoryId?: number;
  categoryName?: string;
  subCategoryId?: number;
  subCategoryName?: string;
  collectionId?: number;
  collectionName?: string;
  brand?: string;
  material?: string;
  pattern?: string;
  colors?: string[];
  sizes?: string[];
  length?: number;
  width?: number;
  height?: number;
  weight?: number;
  stockQuantity: number;
  basePrice: number;
  discountPercentage?: number;
  offerPrice?: number;
  status: string;
  isFeatured?: boolean;
  isTrending?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  isPremium?: boolean;
  tags?: string[];
  images: ProductImage[];
  specifications: ProductSpecification[];
  variants: ProductVariant[];
  category?: Category;
  subCategory?: SubCategory;
}

interface FeedbackItem {
  id: number;
  userId: number;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
}

interface RelatedProduct {
  id: number;
  name: string;
  basePrice: number;
  offerPrice?: number;
  discountPercentage?: number;
  thumbnailUrl?: string;
  stockQuantity: number;
}

// ─── Helper components ──────────────────────────────────────────────────────

function LazyImage({
  src,
  alt,
  className,
  style,
  onMouseMove,
  onMouseLeave,
}: {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  onMouseMove?: (e: React.MouseEvent<HTMLImageElement>) => void;
  onMouseLeave?: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && imgRef.current) {
          imgRef.current.src = src;
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (imgRef.current) observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [src]);

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
      {!loaded && (
        <Skeleton
          variant="rectangular"
          sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        />
      )}
      <img
        ref={imgRef}
        alt={alt}
        className={className}
        style={{ ...style, opacity: loaded ? 1 : 0, transition: 'opacity 0.3s' }}
        onLoad={() => setLoaded(true)}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
      />
    </Box>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({});
  const [isZooming, setIsZooming] = useState(false);

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([]);
  const [similarProducts, setSimilarProducts] = useState<RelatedProduct[]>([]);
  const [reviews, setReviews] = useState<FeedbackItem[]>([]);
  const [averageRating, setAverageRating] = useState<number>(0);

  // ─── Fetch product detail ──────────────────────────────────────────────

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    axiosInstance
      .get(`/products/${id}`)
      .then((res) => {
        const data = res.data?.data || res.data;
        setProduct(data);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to load product');
      })
      .finally(() => setLoading(false));
  }, [id]);

  // ─── Fetch related & similar products ──────────────────────────────────

  useEffect(() => {
    if (!id) return;

    axiosInstance
      .get(`/products/${id}/related`)
      .then((res) => setRelatedProducts(res.data?.data || res.data || []))
      .catch(() => {});

    axiosInstance
      .get(`/products/${id}/similar`)
      .then((res) => setSimilarProducts(res.data?.data || res.data || []))
      .catch(() => {});
  }, [id]);

  // ─── Fetch reviews ─────────────────────────────────────────────────────

  useEffect(() => {
    if (!id) return;

    axiosInstance
      .get(`/feedback/products/${id}`)
      .then((res) => {
        const data = res.data?.data || res.data || [];
        setReviews(Array.isArray(data) ? data : []);
      })
      .catch(() => {});

    axiosInstance
      .get(`/feedback/products/${id}/rating`)
      .then((res) => {
        const rating = res.data?.data ?? res.data ?? 0;
        setAverageRating(typeof rating === 'number' ? rating : 0);
      })
      .catch(() => {});
  }, [id]);

  // ─── Availability based on variant selection ───────────────────────────

  const availability = useMemo(() => {
    if (!product) return { available: false, stock: 0, price: 0 };

    // If user selected a color/size, find matching variant
    if (selectedColor || selectedSize) {
      const matchingVariants = product.variants.filter((v) => {
        const colorMatch = !selectedColor || v.color === selectedColor;
        const sizeMatch = !selectedSize || v.size === selectedSize;
        return colorMatch && sizeMatch;
      });

      if (matchingVariants.length > 0) {
        const totalStock = matchingVariants.reduce((sum, v) => sum + v.stockQuantity, 0);
        const minPrice = Math.min(...matchingVariants.map((v) => v.price));
        return { available: totalStock > 0, stock: totalStock, price: minPrice };
      }

      return { available: false, stock: 0, price: product.offerPrice || product.basePrice };
    }

    return {
      available: product.stockQuantity > 0,
      stock: product.stockQuantity,
      price: product.offerPrice || product.basePrice,
    };
  }, [product, selectedColor, selectedSize]);

  // ─── Image zoom handler ────────────────────────────────────────────────

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomStyle({
      transformOrigin: `${x}% ${y}%`,
      transform: 'scale(2)',
    });
    setIsZooming(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setZoomStyle({});
    setIsZooming(false);
  }, []);

  // ─── Breadcrumb ────────────────────────────────────────────────────────

  const breadcrumbItems: BreadcrumbItem[] = useMemo(() => {
    if (!product) return [];
    const items: BreadcrumbItem[] = [];
    if (product.categoryName) {
      items.push({ label: product.categoryName, path: `/categories/${product.categoryId}` });
    }
    if (product.subCategoryName) {
      items.push({ label: product.subCategoryName, path: `/categories/${product.categoryId}?sub=${product.subCategoryId}` });
    }
    items.push({ label: product.name });
    return items;
  }, [product]);

  // ─── Image helpers ─────────────────────────────────────────────────────

  const images = product?.images?.filter((img) => img.mediaType !== 'VIDEO') || [];
  const videos = product?.images?.filter((img) => img.mediaType === 'VIDEO') || [];
  const mainImage = images[selectedImageIndex];

  const getImageSrc = (img: ProductImage) => {
    if (img.base64Data.startsWith('/')) return resolveMediaUrl(img.base64Data);
    if (img.base64Data.startsWith('http') || img.base64Data.startsWith('data:')) return img.base64Data;
    return `data:${img.mimeType};base64,${img.base64Data}`;
  };

  // ─── Loading state ─────────────────────────────────────────────────────

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Skeleton variant="text" width={300} height={24} sx={{ mb: 2 }} />
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Skeleton variant="rectangular" height={500} sx={{ borderRadius: 2 }} />
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} variant="rectangular" width={80} height={80} sx={{ borderRadius: 1 }} />
              ))}
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Skeleton variant="text" width="80%" height={40} />
            <Skeleton variant="text" width="40%" height={32} sx={{ mt: 2 }} />
            <Skeleton variant="text" width="60%" height={24} sx={{ mt: 2 }} />
            <Skeleton variant="rectangular" height={120} sx={{ mt: 3, borderRadius: 1 }} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  // ─── Error state ───────────────────────────────────────────────────────

  if (error || !product) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error">{error || 'Product not found'}</Alert>
      </Container>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbItems} showHome />

      <Grid container spacing={4}>
        {/* ─── Image Gallery ──────────────────────────────────────── */}
        <Grid size={{ xs: 12, md: 6 }}>
          {/* Main image with zoom */}
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              aspectRatio: '1',
              overflow: 'hidden',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              cursor: isZooming ? 'zoom-out' : 'zoom-in',
              bgcolor: 'background.paper',
            }}
          >
            {mainImage ? (
              <img
                src={getImageSrc(mainImage)}
                alt={product.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  transition: 'transform 0.15s ease-out',
                  ...zoomStyle,
                }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              />
            ) : (
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'grey.100',
                }}
              >
                <Typography color="text.secondary">No Image Available</Typography>
              </Box>
            )}
          </Box>

          {/* Thumbnails */}
          {images.length > 1 && (
            <Box sx={{ display: 'flex', gap: 1, mt: 2, overflowX: 'auto', pb: 1 }}>
              {images.map((img, index) => (
                <Box
                  key={img.id}
                  onClick={() => setSelectedImageIndex(index)}
                  sx={{
                    width: 72,
                    height: 72,
                    minWidth: 72,
                    borderRadius: 1,
                    overflow: 'hidden',
                    border: '2px solid',
                    borderColor: index === selectedImageIndex ? 'primary.main' : 'divider',
                    cursor: 'pointer',
                    opacity: index === selectedImageIndex ? 1 : 0.7,
                    transition: 'all 0.2s',
                    '&:hover': { opacity: 1, borderColor: 'primary.light' },
                  }}
                >
                  <LazyImage
                    src={getImageSrc(img)}
                    alt={`${product.name} - ${index + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </Box>
              ))}
            </Box>
          )}

          {videos.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>Product videos</Typography>
              <Grid container spacing={1}>
                {videos.map((video) => (
                  <Grid key={video.id} size={{ xs: 12, sm: 6 }}>
                    <video controls preload="metadata" style={{ width: '100%', display: 'block', borderRadius: 8 }}>
                      <source src={getImageSrc(video)} type={video.mimeType} />
                      Your browser does not support this video.
                    </video>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Grid>

        {/* ─── Product Info ───────────────────────────────────────── */}
        <Grid size={{ xs: 12, md: 6 }}>
          {/* Product name & badges */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              {product.name}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
              {product.isNewArrival && <Chip label="New Arrival" color="info" size="small" />}
              {product.isBestSeller && <Chip label="Best Seller" color="success" size="small" />}
              {product.isTrending && <Chip label="Trending" color="warning" size="small" />}
              {product.isPremium && <Chip label="Premium" color="secondary" size="small" />}
              {product.isFeatured && <Chip label="Featured" size="small" variant="outlined" />}
            </Box>
          </Box>

          {/* Rating */}
          {averageRating > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Rating value={averageRating} precision={0.1} readOnly size="medium" />
              <Typography variant="body2" color="text.secondary">
                ({averageRating.toFixed(1)}) · {reviews.length} review{reviews.length !== 1 ? 's' : ''}
              </Typography>
            </Box>
          )}

          {/* Price */}
          <Box sx={{ mb: 3 }}>
            {product.discountPercentage && product.discountPercentage > 0 ? (
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5 }}>
                <Typography variant="h5" fontWeight={700} color="primary.main">
                  ₹{(product.offerPrice || availability.price).toLocaleString('en-IN')}
                </Typography>
                <Typography
                  variant="h6"
                  color="text.secondary"
                  sx={{ textDecoration: 'line-through' }}
                >
                  ₹{product.basePrice.toLocaleString('en-IN')}
                </Typography>
                <Chip
                  label={`${product.discountPercentage}% OFF`}
                  color="error"
                  size="small"
                />
              </Box>
            ) : (
              <Typography variant="h5" fontWeight={700} color="primary.main">
                ₹{product.basePrice.toLocaleString('en-IN')}
              </Typography>
            )}
          </Box>

          {/* Short description */}
          {product.shortDescription && (
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              {product.shortDescription}
            </Typography>
          )}

          {/* Material */}
          {product.material && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight={600}>
                Material
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {product.material}
              </Typography>
            </Box>
          )}

          {/* Colors */}
          {product.colors && product.colors.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                Colors
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {product.colors.map((color) => (
                  <Chip
                    key={color}
                    label={color}
                    variant={selectedColor === color ? 'filled' : 'outlined'}
                    color={selectedColor === color ? 'primary' : 'default'}
                    onClick={() => setSelectedColor(selectedColor === color ? null : color)}
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Sizes */}
          {product.sizes && product.sizes.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                Sizes
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {product.sizes.map((size) => (
                  <Chip
                    key={size}
                    label={size}
                    variant={selectedSize === size ? 'filled' : 'outlined'}
                    color={selectedSize === size ? 'primary' : 'default'}
                    onClick={() => setSelectedSize(selectedSize === size ? null : size)}
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Availability */}
          <Box sx={{ mt: 3, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: availability.available ? 'success.main' : 'error.main',
                }}
              />
              <Typography
                variant="body2"
                fontWeight={600}
                color={availability.available ? 'success.main' : 'error.main'}
              >
                {availability.available
                  ? `In Stock (${availability.stock} available)`
                  : 'Out of Stock'}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Long description */}
          {product.longDescription && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Description
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ whiteSpace: 'pre-line' }}
              >
                {product.longDescription}
              </Typography>
            </Box>
          )}
        </Grid>
      </Grid>

      {/* ─── Specifications Table ────────────────────────────────────────── */}
      {product.specifications && product.specifications.length > 0 && (
        <Box sx={{ mt: 6 }}>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Specifications
          </Typography>
          <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
            <Table>
              <TableBody>
                {product.specifications
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((spec) => (
                    <TableRow key={spec.id}>
                      <TableCell
                        sx={{ fontWeight: 600, width: '30%', bgcolor: 'action.hover' }}
                      >
                        {spec.specKey}
                      </TableCell>
                      <TableCell>{spec.specValue}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* ─── Reviews Section ─────────────────────────────────────────────── */}
      {reviews.length > 0 && (
        <Box sx={{ mt: 6 }}>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Customer Reviews
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Rating value={averageRating} precision={0.1} readOnly />
            <Typography variant="body1">
              {averageRating.toFixed(1)} out of 5 · {reviews.length} review
              {reviews.length !== 1 ? 's' : ''}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {reviews.map((review) => (
              <Paper key={review.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                  <Avatar sx={{ width: 32, height: 32, fontSize: 14 }}>
                    {review.userName?.charAt(0)?.toUpperCase() || 'U'}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {review.userName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(review.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Typography>
                  </Box>
                </Box>
                <Rating value={review.rating} readOnly size="small" sx={{ mb: 0.5 }} />
                <Typography variant="subtitle2" fontWeight={600}>
                  {review.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {review.comment}
                </Typography>
              </Paper>
            ))}
          </Box>
        </Box>
      )}

      {/* ─── Related Products ────────────────────────────────────────────── */}
      {relatedProducts.length > 0 && (
        <Box sx={{ mt: 6 }}>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Related Products
          </Typography>
          <Grid container spacing={2}>
            {relatedProducts.slice(0, 4).map((rp) => (
              <Grid key={rp.id} size={{ xs: 6, sm: 4, md: 3 }}>
                <ProductCard product={rp} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* ─── Similar Products ────────────────────────────────────────────── */}
      {similarProducts.length > 0 && (
        <Box sx={{ mt: 6, mb: 4 }}>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Similar Products
          </Typography>
          <Grid container spacing={2}>
            {similarProducts.slice(0, 4).map((sp) => (
              <Grid key={sp.id} size={{ xs: 6, sm: 4, md: 3 }}>
                <ProductCard product={sp} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Container>
  );
}

// ─── Product Card sub-component ─────────────────────────────────────────────

function ProductCard({ product }: { product: RelatedProduct }) {
  const imgSrc = resolveMediaUrl(product.thumbnailUrl) || '';

  return (
    <Card variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
      <CardActionArea component={Link} to={`/products/${product.id}`}>
        <CardMedia
          sx={{
            height: 180,
            bgcolor: 'grey.100',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {imgSrc ? (
            <LazyImage
              src={imgSrc}
              alt={product.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <Typography variant="caption" color="text.secondary">
              No Image
            </Typography>
          )}
        </CardMedia>
        <CardContent sx={{ p: 1.5 }}>
          <Typography variant="body2" fontWeight={600} noWrap>
            {product.name}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5, mt: 0.5 }}>
            <Typography variant="body2" fontWeight={700} color="primary.main">
              ₹{(product.offerPrice || product.basePrice).toLocaleString('en-IN')}
            </Typography>
            {product.discountPercentage && product.discountPercentage > 0 && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ textDecoration: 'line-through' }}
              >
                ₹{product.basePrice.toLocaleString('en-IN')}
              </Typography>
            )}
          </Box>
          {product.stockQuantity <= 0 && (
            <Typography variant="caption" color="error.main">
              Out of Stock
            </Typography>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
