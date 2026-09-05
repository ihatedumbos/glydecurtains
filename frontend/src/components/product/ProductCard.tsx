import { useState, useRef, useCallback } from 'react';
import { Box, Card, CardMedia, CardContent, Typography, Chip } from '@mui/material';
import { motion } from 'framer-motion';
import WishlistButton from '@/components/product/WishlistButton';
import QuickViewPopup, { type ProductVariant } from '@/components/product/QuickViewPopup';
import type { Product } from '@/store/slices/productSlice';
import { resolveMediaUrl } from '@/utils/mediaUrl';

interface ProductCardProps {
  product: Product;
  variants?: ProductVariant[];
  onAddToCart?: (product: Product, variant: ProductVariant | null) => void;
  onClick?: (product: Product) => void;
}

/** Delay (ms) before showing/hiding the quick-view popup on hover */
const HOVER_SHOW_DELAY = 300;
const HOVER_HIDE_DELAY = 300;

export default function ProductCard({ product, variants = [], onAddToCart, onClick }: ProductCardProps) {
  const [showQuickView, setShowQuickView] = useState(false);
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasDiscount = product.discountPercentage && product.discountPercentage > 0;
  const displayPrice = product.offerPrice ?? product.basePrice;

  const handleMouseEnter = useCallback(() => {
    // Cancel any pending hide
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    // Start show timer
    showTimerRef.current = setTimeout(() => {
      setShowQuickView(true);
    }, HOVER_SHOW_DELAY);
  }, []);

  const handleMouseLeave = useCallback(() => {
    // Cancel any pending show
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
    // Start hide timer
    hideTimerRef.current = setTimeout(() => {
      setShowQuickView(false);
    }, HOVER_HIDE_DELAY);
  }, []);

  const handleCardClick = useCallback(() => {
    onClick?.(product);
  }, [onClick, product]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleCardClick}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          borderRadius: 2,
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          '&:hover': {
            transform: 'translateY(-6px)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.12), 0 0 20px rgba(99,102,241,0.08)',
          },
          '&:hover .wishlist-btn': {
            opacity: 1,
          },
        }}
      >
        {/* Discount badge */}
        {hasDiscount && (
          <Chip
            label={`-${product.discountPercentage}%`}
            color="error"
            size="small"
            sx={{ position: 'absolute', top: 8, left: 8, zIndex: 2, fontWeight: 600 }}
          />
        )}

        {/* Status badges */}
        <Box sx={{ position: 'absolute', top: 8, right: 48, zIndex: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {product.isNewArrival && <Chip label="New" color="success" size="small" />}
          {product.isTrending && <Chip label="Trending" color="warning" size="small" />}
        </Box>

        {/* Wishlist heart icon – top right */}
        <Box
          className="wishlist-btn"
          sx={{
            position: 'absolute',
            top: 4,
            right: 4,
            zIndex: 2,
            opacity: 0,
            transition: 'opacity 0.2s ease',
          }}
        >
          <WishlistButton productId={product.id} size="small" showTooltip />
        </Box>

        {/* Product image */}
        <CardMedia
          component="img"
          height="220"
          image={resolveMediaUrl(product.thumbnailUrl) || '/assets/logo/poster.png'}
          alt={product.name}
          sx={{ objectFit: 'cover' }}
          loading="lazy"
        />

        {/* Product info */}
        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography
            variant="body2"
            color="text.secondary"
            noWrap
            title={product.name}
          >
            {product.name}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 'auto' }}>
            <Typography variant="subtitle1" fontWeight={700} color="primary">
              ₹{displayPrice.toLocaleString('en-IN')}
            </Typography>
            {hasDiscount && (
              <Typography variant="body2" color="text.disabled" sx={{ textDecoration: 'line-through' }}>
                ₹{product.basePrice.toLocaleString('en-IN')}
              </Typography>
            )}
          </Box>

          {product.stockQuantity === 0 && (
            <Typography variant="caption" color="error">
              Out of Stock
            </Typography>
          )}
        </CardContent>

        {/* Quick-View Popup (animated entrance/exit) */}
        <QuickViewPopup
          product={product}
          open={showQuickView}
          variants={variants}
          onAddToCart={onAddToCart}
        />
      </Card>
    </motion.div>
  );
}
