import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { fetchCart, updateCartItemQuantity, removeCartItem } from '@/store/slices/cartSlice';
import CartItemRow from './CartItem';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function CartDrawer({ open, onClose }: CartDrawerProps) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { items, grandTotal, loading } = useAppSelector((state) => state.cart);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (open && isAuthenticated) {
      dispatch(fetchCart());
    }
  }, [open, isAuthenticated, dispatch]);

  const unavailableItems = items.filter((item) => !item.available);

  const handleQuantityChange = (cartItemId: number, quantity: number) => {
    dispatch(updateCartItemQuantity({ cartItemId, quantity }));
  };

  const handleRemove = (cartItemId: number) => {
    dispatch(removeCartItem(cartItemId));
  };

  const handleViewCart = () => {
    onClose();
    navigate('/cart');
  };

  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: '100%', sm: 400 }, display: 'flex', flexDirection: 'column' },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          py: 1.5,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ShoppingCartOutlinedIcon fontSize="small" />
          <Typography variant="h6" fontSize="1rem" fontWeight={600}>
            Cart ({items.length} {items.length === 1 ? 'item' : 'items'})
          </Typography>
        </Box>
        <IconButton onClick={onClose} aria-label="Close cart" size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Unavailable notification */}
      {unavailableItems.length > 0 && (
        <Alert severity="warning" sx={{ mx: 2, mt: 1.5, borderRadius: 1 }}>
          {unavailableItems.length} {unavailableItems.length === 1 ? 'item is' : 'items are'} no
          longer available.
        </Alert>
      )}

      {/* Items list */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: 0 }}>
        {loading && items.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={32} />
          </Box>
        ) : items.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6, px: 3 }}>
            <ShoppingCartOutlinedIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography color="text.secondary">Your cart is empty</Typography>
          </Box>
        ) : (
          items.map((item) => (
            <CartItemRow
              key={item.id}
              item={item}
              onQuantityChange={handleQuantityChange}
              onRemove={handleRemove}
              disabled={loading}
            />
          ))
        )}
      </Box>

      {/* Footer */}
      {items.length > 0 && (
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              Grand Total
            </Typography>
            <Typography variant="subtitle1" fontWeight={700}>
              ₹{grandTotal.toLocaleString('en-IN')}
            </Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />
          <Button
            variant="contained"
            fullWidth
            onClick={handleCheckout}
            disabled={unavailableItems.length === items.length}
            sx={{ mb: 1 }}
          >
            Proceed to Checkout
          </Button>
          <Button variant="outlined" fullWidth onClick={handleViewCart}>
            View Full Cart
          </Button>
        </Box>
      )}
    </Drawer>
  );
}
