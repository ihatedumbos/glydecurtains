import { IconButton, Tooltip, CircularProgress } from '@mui/material';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { useIsInWishlist, useIsTogglingWishlist, useWishlist } from '@/hooks/useWishlist';

export interface WishlistButtonProps {
  /** The product ID to toggle in the wishlist */
  productId: number;
  /** Size variant for different contexts */
  size?: 'small' | 'medium' | 'large';
  /** Optional custom class name */
  className?: string;
  /** Whether to show a tooltip */
  showTooltip?: boolean;
}

/**
 * Reusable WishlistButton component that displays a filled/empty heart icon
 * based on whether the product is in the user's wishlist.
 *
 * Can be used on product cards and detail pages.
 * Requires user to be authenticated — redirects to login if not.
 */
export default function WishlistButton({
  productId,
  size = 'medium',
  className,
  showTooltip = true,
}: WishlistButtonProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const isInWishlist = useIsInWishlist(productId);
  const isToggling = useIsTogglingWishlist(productId);
  const { toggleWishlist } = useWishlist();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    await toggleWishlist(productId);
  };

  const tooltipTitle = isInWishlist ? 'Remove from wishlist' : 'Add to wishlist';

  const iconSizeMap = {
    small: '1.125rem',
    medium: '1.5rem',
    large: '1.75rem',
  };

  const button = (
    <IconButton
      aria-label={tooltipTitle}
      onClick={handleClick}
      disabled={isToggling}
      size={size}
      className={className}
      sx={{
        color: isInWishlist ? 'error.main' : 'text.secondary',
        transition: 'color 0.2s ease, transform 0.2s ease',
        '&:hover': {
          color: 'error.main',
          transform: 'scale(1.1)',
        },
        '&:active': {
          transform: 'scale(0.95)',
        },
      }}
    >
      {isToggling ? (
        <CircularProgress size={iconSizeMap[size]} color="inherit" />
      ) : isInWishlist ? (
        <FavoriteIcon sx={{ fontSize: iconSizeMap[size] }} />
      ) : (
        <FavoriteBorderIcon sx={{ fontSize: iconSizeMap[size] }} />
      )}
    </IconButton>
  );

  if (showTooltip) {
    return <Tooltip title={tooltipTitle}>{button}</Tooltip>;
  }

  return button;
}
