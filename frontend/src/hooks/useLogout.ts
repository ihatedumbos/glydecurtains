import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '@/store/hooks';
import { logoutAction } from '@/store/logoutAction';

const AUTH_STORAGE_KEY = 'glyde_auth';
const REMEMBER_ME_KEY = 'glyde_remember_me';
const SESSION_LAST_ACTIVITY_KEY = 'glyde_last_activity';

/**
 * Hook that provides a logout function which:
 * 1. Clears all user-specific Redux state (auth, cart, orders, wishlist, etc.)
 * 2. Clears localStorage tokens and session data
 * 3. Redirects to the login page
 */
export function useLogout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const performLogout = useCallback(() => {
    // 1. Dispatch the shared logout action to clear all user-specific Redux state
    dispatch(logoutAction());

    // 2. Clear localStorage auth data
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(REMEMBER_ME_KEY);
    localStorage.removeItem(SESSION_LAST_ACTIVITY_KEY);

    // 3. Redirect to login page
    navigate('/login', { replace: true });
  }, [dispatch, navigate]);

  return { logout: performLogout };
}
