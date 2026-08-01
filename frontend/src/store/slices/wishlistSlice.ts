import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface WishlistItem {
  id: number;
  productId: number;
  productName: string;
  basePrice: number;
  offerPrice?: number;
  thumbnailUrl?: string;
  addedAt: string;
}

export interface WishlistState {
  items: WishlistItem[];
  count: number;
  loading: boolean;
  togglingProductIds: number[];
  error: string | null;
}

const initialState: WishlistState = {
  items: [],
  count: 0,
  loading: false,
  togglingProductIds: [],
  error: null,
};

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    setWishlist(state, action: PayloadAction<{ items: WishlistItem[]; count: number }>) {
      state.items = action.payload.items;
      state.count = action.payload.count;
    },
    addWishlistItem(state, action: PayloadAction<WishlistItem>) {
      const exists = state.items.some((item) => item.productId === action.payload.productId);
      if (!exists) {
        state.items.push(action.payload);
        state.count = state.items.length;
      }
    },
    removeWishlistItem(state, action: PayloadAction<number>) {
      state.items = state.items.filter((item) => item.productId !== action.payload);
      state.count = state.items.length;
    },
    setWishlistLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    addTogglingProductId(state, action: PayloadAction<number>) {
      if (!state.togglingProductIds.includes(action.payload)) {
        state.togglingProductIds.push(action.payload);
      }
    },
    removeTogglingProductId(state, action: PayloadAction<number>) {
      state.togglingProductIds = state.togglingProductIds.filter((id) => id !== action.payload);
    },
    setWishlistError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    clearWishlist(state) {
      state.items = [];
      state.count = 0;
    },
  },
});

// Selectors (use with useAppSelector)
export const selectIsInWishlist = (productId: number) => (state: { wishlist: WishlistState }): boolean =>
  state.wishlist.items.some((item) => item.productId === productId);

export const selectIsTogglingWishlist = (productId: number) => (state: { wishlist: WishlistState }): boolean =>
  state.wishlist.togglingProductIds.includes(productId);

export const {
  setWishlist,
  addWishlistItem,
  removeWishlistItem,
  setWishlistLoading,
  addTogglingProductId,
  removeTogglingProductId,
  setWishlistError,
  clearWishlist,
} = wishlistSlice.actions;

export default wishlistSlice.reducer;
