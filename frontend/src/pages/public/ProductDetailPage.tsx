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
  Button,
  IconButton,
} from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PhoneIcon from '@mui/icons-material/Phone';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import Breadcrumb, { BreadcrumbItem } from '@/components/layout/Breadcrumb';
import axiosInstance from '@/api/axiosInstance';
import { resolveMediaUrl } from '@/utils/mediaUrl';
import { CONTACT, productEnquiryLink } from '@/config/contact';
import { formatPrice, sizeNumber } from '@/utils/price';

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
    setSelectedImageIndex(0);

    axiosInstance
      .get(`/products/public/${id}`)
      .then((res) => {
        const data = res.data?.data || res.data;
        setProduct(data);
      })
      .catch((err) => {
        const fallbackError = err.response?.data?.message || 'Failed to load product';
        setError(fallbackError);
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

  // ─── Size / colour options and the default selection ──────────────────

  const colorOptions = useMemo(() => {
    if (!product) return [];
    const fromVariants = (product.variants || []).map((v) => v.color?.trim()).filter((c): c is string => !!c);
    return Array.from(new Set([...(product.colors || []), ...fromVariants]));
  }, [product]);

  const sizeOptions = useMemo(() => {
    if (!product) return [];
    const fromVariants = (product.variants || []).map((v) => v.size?.trim()).filter((s): s is string => !!s);
    return Array.from(new Set([...(product.sizes || []), ...fromVariants])).sort(
      (a, b) => sizeNumber(a) - sizeNumber(b),
    );
  }, [product]);

  // Start on the smallest size and the first colour, so the price shown matches a real option.
  useEffect(() => {
    if (!product) return;
    const smallest = sizeOptions[0] ?? null;
    const variantForSize = (product.variants || []).find((v) => v.size?.trim() === smallest && v.color);
    setSelectedSize(smallest);
    setSelectedColor(variantForSize?.color?.trim() ?? colorOptions[0] ?? null);
  }, [product, sizeOptions, colorOptions]);

  const selectedOptionLabel = [selectedSize, selectedColor].filter(Boolean).join(', ');

  // ─── Availability based on variant selection ───────────────────────────

  const availability = useMemo(() => {
    if (!product) return { available: false, stock: 0, price: 0 };

    // If user selected a color/size, find matching variant
    if (selectedColor || selectedSize) {
      const matchingVariants = (product.variants || []).filter((v) => {
        const colorMatch = !selectedColor || !v.color || v.color.trim() === selectedColor;
        const sizeMatch = !selectedSize || !v.size || v.size.trim() === selectedSize;
        return colorMatch && sizeMatch;
      });

      if (matchingVariants.length > 0) {
        const totalStock = matchingVariants.reduce((sum, v) => sum + v.stockQuantity, 0);
        const minPrice = Math.min(...matchingVariants.map((v) => v.price));
        // Variants entered without stock fall back to the product's own stock figure.
        const stock = totalStock || product.stockQuantity;
        return { available: stock > 0, stock, price: minPrice };
      }

      // A size/colour combination without its own price is quoted on WhatsApp instead.
      const hasVariants = (product.variants || []).length > 0;
      return {
        available: product.stockQuantity > 0,
        stock: product.stockQuantity,
        price: hasVariants ? 0 : product.offerPrice || product.basePrice,
      };
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
  const media = [...images, ...videos];
  const mainMedia = media[selectedImageIndex] ?? media[0];
  const mainIsVideo = mainMedia?.mediaType === 'VIDEO';

  // Wraps around at either end so the arrows always do something.
  const showMedia = (index: number) => {
    if (media.length === 0) return;
    setIsZooming(false);
    setZoomStyle({});
    setSelectedImageIndex((index + media.length) % media.length);
  };

  const galleryArrowSx = {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    bgcolor: 'rgba(255, 255, 255, 0.92)',
    color: '#14232b',
    boxShadow: '0 1px 4px rgba(20, 35, 43, 0.25)',
    '&:hover': { bgcolor: '#ffffff' },
  } as const;

  const getImageSrc = (img?: Partial<ProductImage> | null) => {
    const fallbackImage = '/assets/logo/poster.png';
    if (!img || !img.base64Data) return fallbackImage;
    if (img.base64Data.startsWith('/')) return resolveMediaUrl(img.base64Data) || fallbackImage;
    if (img.base64Data.startsWith('http') || img.base64Data.startsWith('data:')) return img.base64Data;
    return `data:${img.mimeType || 'image/jpeg'};base64,${img.base64Data}`;
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


  const shownRelatedIds = new Set(relatedProducts.slice(0, 4).map((rp) => rp.id));
  const visibleSimilarProducts = similarProducts.filter((sp) => !shownRelatedIds.has(sp.id)).slice(0, 4);
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Breadcrumb */}
      <Breadcrumb items={breadcrumbItems} showHome />

      <Grid container spacing={4}>
        {/* ─── Image Gallery ──────────────────────────────────────── */}
        <Grid size={{ xs: 12, md: 6 }}>
          {/* Main viewer: photos and videos share one space, stepped with the arrows or thumbnails */}
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              aspectRatio: '1',
              overflow: 'hidden',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              cursor: mainIsVideo ? 'default' : isZooming ? 'zoom-out' : 'zoom-in',
              bgcolor: mainIsVideo ? 'common.black' : 'background.paper',
            }}
          >
            {mainMedia && mainIsVideo ? (
              <video
                key={mainMedia.id}
                controls
                playsInline
                preload="metadata"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }}
              >
                {/* "#t=0.1" makes browsers paint the first frame instead of a blank box before play. */}
                <source src={`${getImageSrc(mainMedia)}#t=0.1`} type={mainMedia.mimeType} />
                Your browser does not support this video.
              </video>
            ) : mainMedia ? (
              <img
                src={getImageSrc(mainMedia)}
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

            {media.length > 1 && (
              <>
                <IconButton
                  aria-label="Previous photo or video"
                  onClick={() => showMedia(selectedImageIndex - 1)}
                  sx={{ ...galleryArrowSx, left: 8 }}
                >
                  <ChevronLeftIcon />
                </IconButton>
                <IconButton
                  aria-label="Next photo or video"
                  onClick={() => showMedia(selectedImageIndex + 1)}
                  sx={{ ...galleryArrowSx, right: 8 }}
                >
                  <ChevronRightIcon />
                </IconButton>
                <Box
                  aria-live="polite"
                  sx={{
                    position: 'absolute',
                    right: 12,
                    px: 1.25,
                    py: 0.25,
                    borderRadius: 999,
                    bgcolor: 'rgba(20, 35, 43, 0.75)',
                    color: '#ffffff',
                    fontSize: 13,
                    fontWeight: 600,
                    // Keep clear of the video controls bar.
                    top: mainIsVideo ? 10 : 'auto',
                    bottom: mainIsVideo ? 'auto' : 10,
                  }}
                >
                  {selectedImageIndex + 1} / {media.length}
                </Box>
              </>
            )}
          </Box>

          {/* Thumbnails: photos first, then videos marked with a play icon */}
          {media.length > 1 && (
            <Box sx={{ display: 'flex', gap: 1, mt: 2, overflowX: 'auto', pb: 1 }}>
              {media.map((item, index) => {
                const isVideo = item.mediaType === 'VIDEO';
                return (
                  <Box
                    key={item.id}
                    component="button"
                    type="button"
                    aria-label={`${isVideo ? 'Video' : 'Photo'} ${index + 1} of ${media.length}`}
                    aria-current={index === selectedImageIndex}
                    onClick={() => showMedia(index)}
                    sx={{
                      position: 'relative',
                      p: 0,
                      width: 72,
                      height: 72,
                      minWidth: 72,
                      borderRadius: 1,
                      overflow: 'hidden',
                      border: '2px solid',
                      borderColor: index === selectedImageIndex ? 'primary.main' : 'divider',
                      bgcolor: isVideo ? 'common.black' : 'background.paper',
                      cursor: 'pointer',
                      opacity: index === selectedImageIndex ? 1 : 0.7,
                      transition: 'all 0.2s',
                      '&:hover': { opacity: 1, borderColor: 'primary.light' },
                    }}
                  >
                    {isVideo ? (
                      <>
                        <video
                          muted
                          preload="metadata"
                          src={`${getImageSrc(item)}#t=0.1`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
                        />
                        <PlayCircleOutlineIcon
                          sx={{
                            position: 'absolute',
                            inset: 0,
                            m: 'auto',
                            fontSize: 32,
                            color: '#ffffff',
                            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.6))',
                          }}
                        />
                      </>
                    ) : (
                      <LazyImage
                        src={getImageSrc(item)}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    )}
                  </Box>
                );
              })}
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
                {formatPrice(availability.price)}
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
          {colorOptions.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                Colors
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {colorOptions.map((color) => (
                  <Chip
                    key={color}
                    label={color}
                    variant={selectedColor === color ? 'filled' : 'outlined'}
                    color={selectedColor === color ? 'primary' : 'default'}
                    aria-pressed={selectedColor === color}
                    onClick={() => setSelectedColor(color)}
                    sx={{ cursor: 'pointer' }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Sizes */}
          {sizeOptions.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                Sizes
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {sizeOptions.map((size) => (
                  <Chip
                    key={size}
                    label={size}
                    variant={selectedSize === size ? 'filled' : 'outlined'}
                    color={selectedSize === size ? 'primary' : 'default'}
                    aria-pressed={selectedSize === size}
                    onClick={() => setSelectedSize(size)}
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

          {/* Enquire on WhatsApp: the site is a catalogue, orders are taken over WhatsApp */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 3 }}>
            <Button
              variant="contained"
              size="large"
              component="a"
              href={productEnquiryLink(product, availability.price, selectedOptionLabel)}
              target="_blank"
              rel="noopener noreferrer"
              startIcon={<WhatsAppIcon />}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                flexGrow: 1,
                bgcolor: '#25D366',
                '&:hover': { bgcolor: '#1ebe5a' },
              }}
            >
              Enquire on WhatsApp
            </Button>
            <Button
              variant="outlined"
              size="large"
              component="a"
              href={`tel:${CONTACT.phoneDisplay.replace(/\s/g, '')}`}
              startIcon={<PhoneIcon />}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Call {CONTACT.phoneDisplay}
            </Button>
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
      {/* Skip the row when it would repeat the related products shown just above. */}
      {visibleSimilarProducts.length > 0 && (
        <Box sx={{ mt: 6, mb: 4 }}>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Similar Products
          </Typography>
          <Grid container spacing={2}>
            {visibleSimilarProducts.map((sp) => (
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
            width: '100%',
            aspectRatio: '1',
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
              {formatPrice(product.offerPrice || product.basePrice)}
            </Typography>
            {(product.discountPercentage ?? 0) > 0 && (
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
