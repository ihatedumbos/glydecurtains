import { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  type SelectChangeEvent,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import type { Product } from '@/store/slices/productSlice';
import { productEnquiryLink, useContact } from '@/config/contact';

/** Represents a product variant combination */
export interface ProductVariant {
  id: number;
  material: string;
  size: string;
  color: string;
  price: number | null; // null means "Price on request"
  available: boolean;
}

export interface QuickViewPopupProps {
  product: Product;
  open: boolean;
  variants?: ProductVariant[];
}

/** Animation variants for the popup entrance/exit */
const popupMotion = {
  initial: { opacity: 0, scale: 0.85 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, scale: 0.85, transition: { duration: 0.18, ease: 'easeIn' } },
};

/**
 * QuickViewPopup – appears on ProductCard hover with a 300ms trigger delay.
 * Shows variant selectors (material, size, color), dynamic pricing, and a WhatsApp enquiry button.
 */
export default function QuickViewPopup({ product, open, variants = [] }: QuickViewPopupProps) {
  useContact();
  // Derive unique option lists
  const materials = useMemo(() => [...new Set(variants.map((v) => v.material))], [variants]);
  const sizes = useMemo(() => [...new Set(variants.map((v) => v.size))], [variants]);
  const colors = useMemo(() => [...new Set(variants.map((v) => v.color))], [variants]);

  // Pre-select first available variant values
  const firstAvailable = useMemo(() => variants.find((v) => v.available), [variants]);

  const [selectedMaterial, setSelectedMaterial] = useState<string>(firstAvailable?.material ?? materials[0] ?? '');
  const [selectedSize, setSelectedSize] = useState<string>(firstAvailable?.size ?? sizes[0] ?? '');
  const [selectedColor, setSelectedColor] = useState<string>(firstAvailable?.color ?? colors[0] ?? '');

  // Find the matched variant for current selection
  const matchedVariant = useMemo(
    () =>
      variants.find(
        (v) => v.material === selectedMaterial && v.size === selectedSize && v.color === selectedColor
      ) ?? null,
    [variants, selectedMaterial, selectedSize, selectedColor]
  );

  // Determine display price
  const displayPrice = useMemo(() => {
    if (variants.length === 0) {
      return product.offerPrice ?? product.basePrice;
    }
    if (!matchedVariant || matchedVariant.price === null) {
      return null; // Price on request
    }
    return matchedVariant.price;
  }, [variants, matchedVariant, product]);

  const handleMaterialChange = useCallback((e: SelectChangeEvent) => {
    setSelectedMaterial(e.target.value);
  }, []);

  const handleSizeChange = useCallback((e: SelectChangeEvent) => {
    setSelectedSize(e.target.value);
  }, []);

  const handleColorChange = useCallback((e: SelectChangeEvent) => {
    setSelectedColor(e.target.value);
  }, []);

  const hasVariants = variants.length > 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="quick-view-popup"
          variants={popupMotion}
          initial="initial"
          animate="animate"
          exit="exit"
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 10,
          }}
        >
          <Box
            sx={{
              bgcolor: 'background.paper',
              borderTop: '1px solid',
              borderColor: 'divider',
              p: 1.5,
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              boxShadow: '0 -4px 20px rgba(0,0,0,0.12)',
              backdropFilter: 'blur(8px)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Variant selectors */}
            {hasVariants && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {materials.length > 1 && (
                  <FormControl size="small" sx={{ minWidth: 80, flex: 1 }}>
                    <InputLabel id="qv-material-label">Material</InputLabel>
                    <Select
                      labelId="qv-material-label"
                      value={selectedMaterial}
                      onChange={handleMaterialChange}
                      label="Material"
                    >
                      {materials.map((m) => (
                        <MenuItem key={m} value={m}>
                          {m}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
                {sizes.length > 1 && (
                  <FormControl size="small" sx={{ minWidth: 70, flex: 1 }}>
                    <InputLabel id="qv-size-label">Size</InputLabel>
                    <Select
                      labelId="qv-size-label"
                      value={selectedSize}
                      onChange={handleSizeChange}
                      label="Size"
                    >
                      {sizes.map((s) => (
                        <MenuItem key={s} value={s}>
                          {s}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
                {colors.length > 1 && (
                  <FormControl size="small" sx={{ minWidth: 70, flex: 1 }}>
                    <InputLabel id="qv-color-label">Color</InputLabel>
                    <Select
                      labelId="qv-color-label"
                      value={selectedColor}
                      onChange={handleColorChange}
                      label="Color"
                    >
                      {colors.map((c) => (
                        <MenuItem key={c} value={c}>
                          {c}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </Box>
            )}

            {/* Price display */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {displayPrice ? (
                <Typography variant="subtitle2" fontWeight={700} color="primary">
                  ₹{displayPrice.toLocaleString('en-IN')}
                </Typography>
              ) : (
                <Typography variant="subtitle2" fontWeight={600} color="text.secondary" fontStyle="italic">
                  Price on request
                </Typography>
              )}
            </Box>

            {/* Enquire on WhatsApp (the site takes no online orders) */}
            <Button
              variant="contained"
              size="small"
              fullWidth
              component="a"
              href={productEnquiryLink(product, displayPrice)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              startIcon={<WhatsAppIcon />}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 1.5,
                bgcolor: '#25D366',
                '&:hover': { bgcolor: '#1ebe5a' },
              }}
            >
              Enquire on WhatsApp
            </Button>
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
