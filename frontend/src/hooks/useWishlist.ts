import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  addWishlistItem,
  removeWishlistItem,
  addTogglingProductId,
  removeTogglingProductId,
  setWishlist,
  setWishlistLoading,
  setWishlistError,
  selectIsInWishlist,
  selectIsTogglingWishlist,
} from '@/store/slices/wishlistSlice';
import wishlistService from '@/services/wishlistService';

export function useWishlist() {
  const dispatch = useAppDispatch();
  const wishlistItems = useAppSelector((state) => state.wishlist.items);
  const wishlistCount = useAppSelector((state) => state.wishlist.count);
  const loading = useAppSelector((state) => state.wishlist.loading);

  const isInWishlist = useCallback(
    (productId: number) => wishlistItems.some((item) => item.productId === productId),
    [wishlistItems],
  );

  const fetchWishlist = useCallback(async () => {
    dispatch(setWishlistLoading(true));
    try {
      const data = await wishlistService.getWishlist();
      dispatch(setWishlist({ items: data.items, count: data.count }));
    } catch {
      dispatch(setWishlistError('Failed to fetch wishlist'));
    } finally {
      dispatch(setWishlistLoading(false));
    }
  }, [dispatch]);

  const toggleWishlist = useCallback(
    async (productId: number) => {
      dispatch(addTogglingProductId(productId));
      try {
        const currentlyInWishlist = wishlistItems.some((item) => item.productId === productId);
        if (currentlyInWishlist) {
          dispatch(removeWishlistItem(productId));
          await wishlistService.removeFromWishlist(productId);
        } else {
          const newItem = await wishlistService.addToWishlist(productId);
          dispatch(addWishlistItem(newItem));
        }
      } catch {
        // Revert optimistic update by re-fetching
        await fetchWishlist();
      } finally {
        dispatch(removeTogglingProductId(productId));
      }
    },
    [dispatch, wishlistItems, fetchWishlist],
  );

  return {
    wishlistItems,
    wishlistCount,
    loading,
    isInWishlist,
    toggleWishlist,
    fetchWishlist,
  };
}

export function useIsInWishlist(productId: number): boolean {
  return useAppSelector(selectIsInWishlist(productId));
}

export function useIsTogglingWishlist(productId: number): boolean {
  return useAppSelector(selectIsTogglingWishlist(productId));
}
