import { configureStore, combineReducers } from '@reduxjs/toolkit';
import authReducer, { AuthState } from '@/store/slices/authSlice';
import cartReducer from '@/store/slices/cartSlice';
import productReducer from '@/store/slices/productSlice';
import orderReducer from '@/store/slices/orderSlice';
import wishlistReducer from '@/store/slices/wishlistSlice';
import searchReducer from '@/store/slices/searchSlice';
import cmsReducer from '@/store/slices/cmsSlice';
import uiReducer from '@/store/slices/uiSlice';
import employeeReducer from '@/store/slices/employeeSlice';
import dashboardReducer from '@/store/slices/dashboardSlice';
import storeLocatorReducer from '@/store/slices/storeLocatorSlice';
import feedbackReducer from '@/store/slices/feedbackSlice';
import achievementReducer from '@/store/slices/achievementSlice';
import enquiryReducer from '@/store/slices/enquirySlice';
import permissionReducer from '@/store/slices/permissionSlice';
import inventoryReducer from '@/store/slices/inventorySlice';
import { LOGOUT_ACTION_TYPE } from '@/store/logoutAction';

const AUTH_STORAGE_KEY = 'glyde_auth';

function loadAuthState(): Partial<AuthState> | undefined {
  try {
    const serialized = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!serialized) return undefined;
    const parsed = JSON.parse(serialized);
    return {
      user: parsed.user ?? null,
      accessToken: parsed.accessToken ?? null,
      refreshToken: parsed.refreshToken ?? null,
      isAuthenticated: !!parsed.accessToken,
      loading: false,
      error: null,
    };
  } catch {
    return undefined;
  }
}

function saveAuthState(state: AuthState): void {
  try {
    const serialized = JSON.stringify({
      user: state.user,
      accessToken: state.accessToken,
      refreshToken: state.refreshToken,
    });
    localStorage.setItem(AUTH_STORAGE_KEY, serialized);
  } catch {
    // Silently ignore write errors
  }
}

const appReducer = combineReducers({
  auth: authReducer,
  cart: cartReducer,
  products: productReducer,
  orders: orderReducer,
  wishlist: wishlistReducer,
  search: searchReducer,
  cms: cmsReducer,
  ui: uiReducer,
  employees: employeeReducer,
  dashboard: dashboardReducer,
  storeLocator: storeLocatorReducer,
  feedback: feedbackReducer,
  achievements: achievementReducer,
  enquiries: enquiryReducer,
  permissions: permissionReducer,
  inventory: inventoryReducer,
});

/**
 * Root reducer that clears all user-specific state on logout.
 * Preserves public data while clearing user-specific state.
 */
const rootReducer: typeof appReducer = (state, action) => {
  if (action.type === LOGOUT_ACTION_TYPE) {
    // Preserve non-user-specific slices; reset everything else
    return appReducer(
      {
        auth: undefined as unknown as ReturnType<typeof authReducer>,
        cart: undefined as unknown as ReturnType<typeof cartReducer>,
        products: state?.products,
        orders: undefined as unknown as ReturnType<typeof orderReducer>,
        wishlist: undefined as unknown as ReturnType<typeof wishlistReducer>,
        search: state?.search,
        cms: state?.cms,
        ui: state?.ui,
        employees: undefined as unknown as ReturnType<typeof employeeReducer>,
        dashboard: undefined as unknown as ReturnType<typeof dashboardReducer>,
        storeLocator: state?.storeLocator,
        feedback: undefined as unknown as ReturnType<typeof feedbackReducer>,
        achievements: state?.achievements,
        enquiries: undefined as unknown as ReturnType<typeof enquiryReducer>,
        permissions: undefined as unknown as ReturnType<typeof permissionReducer>,
        inventory: undefined as unknown as ReturnType<typeof inventoryReducer>,
      },
      action,
    );
  }
  return appReducer(state, action);
};

const preloadedAuth = loadAuthState();

export const store = configureStore({
  reducer: rootReducer,
  preloadedState: {
    ...(preloadedAuth ? { auth: { ...{ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, loading: false, error: null }, ...preloadedAuth } } : {}),
  },
});

// Subscribe to store changes to persist auth
let currentAuth: AuthState | undefined;

store.subscribe(() => {
  const state = store.getState();

  // Persist auth tokens only when auth state changes
  if (state.auth !== currentAuth) {
    currentAuth = state.auth;
    saveAuthState(state.auth);
  }
});

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
