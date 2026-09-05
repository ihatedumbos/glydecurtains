import {
  Box,
  Typography,
  IconButton,
  Chip,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import type { CartItem as CartItemType } from '@/store/slices/cartSlice';
import QuantitySelector from '@/components/cart/QuantitySelector';
import { resolveMediaUrl } from '@/utils/mediaUrl';

interface CartItemProps {
  item: CartItemType;
  onQuantityChange: (cartItemId: number, quantity: number) => void;
  onRemove: (cartItemId: number) => void;
  disabled?: boolean;
}

export default function CartItemRow({ item, onQuantityChange, onRemove, disabled }: CartItemProps) {
  const lineSubtotal = item.unitPrice * item.quantity;

  const handleQuantityChange = (quantity: number) => {
    onQuantityChange(item.id, quantity);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 2,
        py: 2,
        px: { xs: 1, md: 2 },
        borderBottom: 1,
        borderColor: 'divider',
        opacity: item.available ? 1 : 0.6,
        position: 'relative',
      }}
    >
      {/* Product image */}
      <Box
        component="img"
        src={resolveMediaUrl(item.imageUrl) || '/assets/placeholder-product.png'}
        alt={item.productName}
        sx={{
          width: { xs: 64, md: 88 },
          height: { xs: 64, md: 88 },
          objectFit: 'cover',
          borderRadius: 1,
          bgcolor: 'grey.100',
          flexShrink: 0,
        }}
      />

      {/* Item details */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle2" noWrap fontWeight={600}>
          {item.productName}
        </Typography>

        {item.variantLabel && (
          <Typography variant="caption" color="text.secondary">
            {item.variantLabel}
          </Typography>
        )}

        {!item.available && (
          <Chip
            icon={<WarningAmberIcon fontSize="small" />}
            label="Unavailable"
            size="small"
            color="warning"
            variant="outlined"
            sx={{ mt: 0.5 }}
          />
        )}

        {/* Price + quantity row */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            mt: 1,
            flexWrap: 'wrap',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            ₹{item.unitPrice.toLocaleString('en-IN')}
          </Typography>

          <QuantitySelector
            value={item.quantity}
            onChange={handleQuantityChange}
            disabled={disabled || !item.available}
          />

          <Typography variant="body2" fontWeight={600} sx={{ ml: 'auto' }}>
            ₹{lineSubtotal.toLocaleString('en-IN')}
          </Typography>
        </Box>
      </Box>

      {/* Remove button */}
      <IconButton
        aria-label={`Remove ${item.productName} from cart`}
        onClick={() => onRemove(item.id)}
        disabled={disabled}
        size="small"
        sx={{ mt: 0.5 }}
      >
        <DeleteOutlineIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}
