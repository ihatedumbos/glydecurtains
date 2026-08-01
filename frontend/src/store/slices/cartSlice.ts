import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '@/api/axiosInstance';

export interface CartItem {
  id: number;
  productId: number;
  variantId?: number;
  productName: string;
  variantLabel?: string;
  quantity: number;
  unitPrice: number;
  imageUrl?: string;
  available: boolean;
}

export interface CartState {
  items: CartItem[];
  subtotal: number;
  grandTotal: number;
  loading: boolean;
  error: string | null;
}

const initialState: CartState = {
  items: [],
  subtotal: 0,
  grandTotal: 0,
  loading: false,
  error: null,
};

// ─── Async Thunks (Backend Sync) ────────────────────────────────────────────

export const fetchCart = createAsyncThunk('cart/fetchCart', async (_, { rejectWithValue }) => {
  try {
    const response = await axiosInstance.get('/cart');
    return response.data.data || response.data;
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } } };
    return rejectWithValue(error.response?.data?.message || 'Failed to fetch cart');
  }
});

export const addCartItem = createAsyncThunk(
  'cart/addItem',
  async (payload: { productId: number; variantId?: number; quantity: number }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post('/cart/items', payload);
      return response.data.data || response.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string; errorCode?: string } } };
      const errorCode = error.response?.data?.errorCode;
      const message = error.response?.data?.message || 'Failed to add item';
      if (errorCode === 'CART_QUANTITY_LIMIT_EXCEEDED') {
        return rejectWithValue(message);
      }
      return rejectWithValue(message);
    }
  },
);

export const updateCartItemQuantity = createAsyncThunk(
  'cart/updateQuantity',
  async (payload: { cartItemId: number; quantity: number }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.put(`/cart/items/${payload.cartItemId}`, {
        quantity: payload.quantity,
      });
      return response.data.data || response.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string; errorCode?: string } } };
      const errorCode = error.response?.data?.errorCode;
      const message = error.response?.data?.message || 'Failed to update quantity';
      if (errorCode === 'CART_QUANTITY_LIMIT_EXCEEDED') {
        return rejectWithValue(message);
      }
      return rejectWithValue(message);
    }
  },
);

export const removeCartItem = createAsyncThunk(
  'cart/removeItem',
  async (cartItemId: number, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.delete(`/cart/items/${cartItemId}`);
      return response.data.data || response.data;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Failed to remove item');
    }
  },
);

export const clearCartItems = createAsyncThunk('cart/clearCart', async (_, { rejectWithValue }) => {
  try {
    await axiosInstance.delete('/cart');
    return { items: [], subtotal: 0, grandTotal: 0 };
  } catch (err: unknown) {
    const error = err as { response?: { data?: { message?: string } } };
    return rejectWithValue(error.response?.data?.message || 'Failed to clear cart');
  }
});

// ─── Helper ─────────────────────────────────────────────────────────────────

function mapCartResponse(data: {
  items?: CartItem[];
  subtotal?: number;
  grandTotal?: number;
}) {
  return {
    items: (data.items || []).map((item) => ({
      ...item,
      available: item.available !== false,
    })),
    subtotal: data.subtotal || 0,
    grandTotal: data.grandTotal || 0,
  };
}

// ─── Slice ──────────────────────────────────────────────────────────────────

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    setCart(state, action: PayloadAction<{ items: CartItem[]; subtotal: number; grandTotal: number }>) {
      state.items = action.payload.items;
      state.subtotal = action.payload.subtotal;
      state.grandTotal = action.payload.grandTotal;
    },
    setCartLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setCartError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    clearCart(state) {
      state.items = [];
      state.subtotal = 0;
      state.grandTotal = 0;
    },
  },
  extraReducers: (builder) => {
    // fetchCart
    builder
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        const data = mapCartResponse(action.payload);
        state.items = data.items;
        state.subtotal = data.subtotal;
        state.grandTotal = data.grandTotal;
        state.loading = false;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // addCartItem
    builder
      .addCase(addCartItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addCartItem.fulfilled, (state, action) => {
        const data = mapCartResponse(action.payload);
        state.items = data.items;
        state.subtotal = data.subtotal;
        state.grandTotal = data.grandTotal;
        state.loading = false;
      })
      .addCase(addCartItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // updateCartItemQuantity
    builder
      .addCase(updateCartItemQuantity.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCartItemQuantity.fulfilled, (state, action) => {
        const data = mapCartResponse(action.payload);
        state.items = data.items;
        state.subtotal = data.subtotal;
        state.grandTotal = data.grandTotal;
        state.loading = false;
      })
      .addCase(updateCartItemQuantity.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // removeCartItem
    builder
      .addCase(removeCartItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeCartItem.fulfilled, (state, action) => {
        const data = mapCartResponse(action.payload);
        state.items = data.items;
        state.subtotal = data.subtotal;
        state.grandTotal = data.grandTotal;
        state.loading = false;
      })
      .addCase(removeCartItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // clearCartItems
    builder
      .addCase(clearCartItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(clearCartItems.fulfilled, (state) => {
        state.items = [];
        state.subtotal = 0;
        state.grandTotal = 0;
        state.loading = false;
      })
      .addCase(clearCartItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setCart, setCartLoading, setCartError, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
