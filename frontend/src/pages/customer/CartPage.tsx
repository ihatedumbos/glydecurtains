import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Divider,
  CircularProgress,
  Alert,
  Skeleton,
} from '@mui/material';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import {
  fetchCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCartItems,
} from '@/store/slices/cartSlice';
import CartItemRow from '@/components/cart/CartItem';

export default function CartPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { items, grandTotal, loading, error } = useAppSelector((state) => state.cart);
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchCart());
    }
  }, [isAuthenticated, dispatch]);

  const unavailableItems = items.filter((item) => !item.available);
  const availableItems = items.filter((item) => item.available);

  const handleQuantityChange = (cartItemId: number, quantity: number) => {
    dispatch(updateCartItemQuantity({ cartItemId, quantity }));
  };

  const handleRemove = (cartItemId: number) => {
    dispatch(removeCartItem(cartItemId));
  };

  const handleClearCart = () => {
    dispatch(clearCartItems());
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  // Not authenticated state
  if (!isAuthenticated) {
    return (
      <Container maxWidth="md" sx={{ py: 6, textAlign: 'center' }}>
        <ShoppingCartOutlinedIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          Please log in to view your cart
        </Typography>
        <Button variant="contained" onClick={() => navigate('/login')} sx={{ mt: 2 }}>
          Log In
        </Button>
      </Container>
    );
  }

  // Loading skeleton
  if (loading && items.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Shopping Cart
        </Typography>
        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
          <Box sx={{ flex: 1 }}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rectangular" height={100} sx={{ mb: 2, borderRadius: 1 }} />
            ))}
          </Box>
          <Box sx={{ width: { xs: '100%', md: 320 } }}>
            <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 1 }} />
          </Box>
        </Box>
      </Container>
    );
  }

  // Empty cart
  if (!loading && items.length === 0) {
    return (
      <Container maxWidth="md" sx={{ py: 6, textAlign: 'center' }}>
        <ShoppingCartOutlinedIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          Your cart is empty
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Browse our collection and add items to your cart.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/products')}>
          Continue Shopping
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Page header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>
          Shopping Cart
        </Typography>
        {items.length > 0 && (
          <Button
            startIcon={<DeleteSweepIcon />}
            color="error"
            size="small"
            onClick={handleClearCart}
            disabled={loading}
          >
            Clear Cart
          </Button>
        )}
      </Box>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Unavailable items notification */}
      {unavailableItems.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {unavailableItems.length} {unavailableItems.length === 1 ? 'item' : 'items'} in your cart{' '}
          {unavailableItems.length === 1 ? 'is' : 'are'} no longer available. Please remove{' '}
          {unavailableItems.length === 1 ? 'it' : 'them'} before checkout.
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Cart items list */}
        <Paper
          variant="outlined"
          sx={{ flex: 1, overflow: 'hidden', position: 'relative' }}
        >
          {loading && (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'rgba(255,255,255,0.6)',
                zIndex: 2,
              }}
            >
              <CircularProgress size={28} />
            </Box>
          )}

          {/* Column headers (desktop) */}
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              px: 2,
              py: 1.5,
              bgcolor: 'grey.50',
              borderBottom: 1,
              borderColor: 'divider',
            }}
          >
            <Typography variant="caption" fontWeight={600} sx={{ flex: 1 }}>
              Product
            </Typography>
            <Typography variant="caption" fontWeight={600} sx={{ width: 80, textAlign: 'center' }}>
              Price
            </Typography>
            <Typography variant="caption" fontWeight={600} sx={{ width: 80, textAlign: 'center' }}>
              Qty
            </Typography>
            <Typography variant="caption" fontWeight={600} sx={{ width: 100, textAlign: 'right' }}>
              Subtotal
            </Typography>
            <Box sx={{ width: 40 }} />
          </Box>

          {items.map((item) => (
            <CartItemRow
              key={item.id}
              item={item}
              onQuantityChange={handleQuantityChange}
              onRemove={handleRemove}
              disabled={loading}
            />
          ))}
        </Paper>

        {/* Order summary */}
        <Paper
          variant="outlined"
          sx={{
            width: { xs: '100%', md: 320 },
            p: 3,
            alignSelf: 'flex-start',
            position: { md: 'sticky' },
            top: { md: 80 },
          }}
        >
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Order Summary
          </Typography>

          <Divider sx={{ my: 1.5 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Items ({availableItems.reduce((sum, item) => sum + item.quantity, 0)})
            </Typography>
            <Typography variant="body2">
              ₹{availableItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0).toLocaleString('en-IN')}
            </Typography>
          </Box>

          <Divider sx={{ my: 1.5 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={700}>
              Grand Total
            </Typography>
            <Typography variant="subtitle1" fontWeight={700}>
              ₹{grandTotal.toLocaleString('en-IN')}
            </Typography>
          </Box>

          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={handleCheckout}
            disabled={loading || availableItems.length === 0}
            sx={{ mb: 1.5 }}
          >
            Proceed to Checkout
          </Button>

          <Button
            variant="text"
            fullWidth
            size="small"
            onClick={() => navigate('/products')}
          >
            Continue Shopping
          </Button>
        </Paper>
      </Box>
    </Container>
  );
}
