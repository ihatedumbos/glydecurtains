import { createAction } from '@reduxjs/toolkit';

/**
 * Shared logout action type used by the root reducer to clear all user-specific state.
 * Dispatch this action to trigger a full state cleanup on logout.
 */
export const LOGOUT_ACTION_TYPE = 'auth/logout';

/**
 * Standalone logout action creator. Dispatching this clears:
 * - auth (user, tokens)
 * - cart
 * - orders
 * - wishlist
 * - employees, dashboard, feedback, enquiries, permissions
 *
 * It preserves public/shared state: theme, ui, cms, products, storeLocator, achievements.
 */
export const logoutAction = createAction(LOGOUT_ACTION_TYPE);
