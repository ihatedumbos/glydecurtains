import { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  IconButton,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Tooltip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { useWishlist } from '@/hooks/useWishlist';
import wishlistService from '@/services/wishlistService';

export default function WishlistPage() {
  const { wishlistItems, loading, fetchWishlist, toggleWishlist } = useWishlist();
  const [movingToCart, setMovingToCart] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const handleRemove = async (productId: number) => {
    setError(null);
    try {
      await toggleWishlist(productId);
    } catch {
      setError('Failed to remove item from wishlist.');
    }
  };

  const handleMoveToCart = async (productId: number, productName: string) => {
    setError(null);
    setMovingToCart(productId);
    try {
      await wishlistService.moveToCart(productId);
      await fetchWishlist();
      setSuccessMsg(`"${productName}" moved to cart.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch {
      setError('Failed to move item to cart.');
    } finally {
      setMovingToCart(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading && wishlistItems.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading wishlist...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 1 }}>
        <FavoriteIcon color="error" />
        <Typography variant="h4" fontWeight="bold">
          My Wishlist
        </Typography>
        {wishlistItems.length > 0 && (
          <Chip label={`${wishlistItems.length} items`} size="small" sx={{ ml: 1 }} />
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {successMsg && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMsg(null)}>
          {successMsg}
        </Alert>
      )}

      {wishlistItems.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <FavoriteIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Your wishlist is empty
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Browse products and add your favorites here.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {wishlistItems.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'box-shadow 0.2s',
                  '&:hover': { boxShadow: 4 },
                }}
              >
                <CardMedia
                  component="img"
                  height="200"
                  image={item.thumbnailUrl || '/placeholder-product.png'}
                  alt={item.productName}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle1" fontWeight="bold" noWrap>
                    {item.productName}
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 1 }}>
                    {item.offerPrice != null ? (
                      <>
                        <Typography variant="h6" color="primary" fontWeight="bold">
                          ${item.offerPrice.toFixed(2)}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ textDecoration: 'line-through' }}
                        >
                          ${item.basePrice.toFixed(2)}
                        </Typography>
                      </>
                    ) : (
                      <Typography variant="h6" color="primary" fontWeight="bold">
                        ${item.basePrice.toFixed(2)}
                      </Typography>
                    )}
                  </Box>

                  <Chip
                    label="In Stock"
                    size="small"
                    color="success"
                    variant="outlined"
                    sx={{ mt: 1 }}
                  />

                  <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                    Added {formatDate(item.addedAt)}
                  </Typography>
                </CardContent>

                <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={
                      movingToCart === item.productId ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : (
                        <ShoppingCartIcon />
                      )
                    }
                    onClick={() => handleMoveToCart(item.productId, item.productName)}
                    disabled={movingToCart === item.productId}
                  >
                    Move to Cart
                  </Button>
                  <Tooltip title="Remove from wishlist">
                    <IconButton
                      color="error"
                      onClick={() => handleRemove(item.productId)}
                      aria-label={`Remove ${item.productName} from wishlist`}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
