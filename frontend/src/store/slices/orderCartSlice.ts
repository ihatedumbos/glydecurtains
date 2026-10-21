import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

/**
 * The customer's cart. The site takes no payments and stores no orders: the cart lives in the
 * visitor's browser only, and "Place order" sends its summary to the shop on WhatsApp.
 */
export interface OrderCartItem {
  /** Product id plus the chosen size and colour, so the same item in two sizes is two lines. */
  key: string;
  productId: number;
  name: string;
  size?: string | null;
  color?: string | null;
  /** 0 means "Price on request". */
  unitPrice: number;
  quantity: number;
  imageUrl?: string | null;
}

export interface OrderCartState {
  items: OrderCartItem[];
}

export const ORDER_CART_STORAGE_KEY = 'glyde_order_cart';
export const MAX_QUANTITY = 999;

export function orderCartKey(productId: number, size?: string | null, color?: string | null): string {
  return [productId, size ?? '', color ?? ''].join('|');
}

export function loadOrderCart(): OrderCartState | undefined {
  try {
    const raw = localStorage.getItem(ORDER_CART_STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed?.items)) return undefined;
    return { items: parsed.items.filter((i: OrderCartItem) => i && i.key && i.productId && i.quantity > 0) };
  } catch {
    return undefined;
  }
}

export function saveOrderCart(state: OrderCartState): void {
  try {
    localStorage.setItem(ORDER_CART_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private mode or full storage: the cart still works until the page is closed.
  }
}

const clampQuantity = (n: number) => Math.max(1, Math.min(MAX_QUANTITY, Math.round(n) || 1));

const orderCartSlice = createSlice({
  name: 'orderCart',
  initialState: { items: [] } as OrderCartState,
  reducers: {
    addToOrderCart(state, action: PayloadAction<Omit<OrderCartItem, 'key'>>) {
      const item = action.payload;
      const key = orderCartKey(item.productId, item.size, item.color);
      const existing = state.items.find((i) => i.key === key);
      if (existing) {
        existing.quantity = clampQuantity(existing.quantity + item.quantity);
        existing.unitPrice = item.unitPrice;
        existing.name = item.name;
        if (item.imageUrl) existing.imageUrl = item.imageUrl;
      } else {
        state.items.push({ ...item, key, quantity: clampQuantity(item.quantity) });
      }
    },
    setOrderCartQuantity(state, action: PayloadAction<{ key: string; quantity: number }>) {
      const item = state.items.find((i) => i.key === action.payload.key);
      if (item) item.quantity = clampQuantity(action.payload.quantity);
    },
    removeFromOrderCart(state, action: PayloadAction<string>) {
      state.items = state.items.filter((i) => i.key !== action.payload);
    },
    clearOrderCart(state) {
      state.items = [];
    },
  },
});

export const { addToOrderCart, setOrderCartQuantity, removeFromOrderCart, clearOrderCart } = orderCartSlice.actions;
export default orderCartSlice.reducer;
