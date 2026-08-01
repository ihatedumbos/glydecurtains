import { useEffect, useRef, useCallback } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { logoutAction } from '@/store/logoutAction';

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const ACTIVITY_CHECK_INTERVAL_MS = 60 * 1000; // Check every 60 seconds
const REMEMBER_ME_KEY = 'glyde_remember_me';
const SESSION_LAST_ACTIVITY_KEY = 'glyde_last_activity';
const AUTH_STORAGE_KEY = 'glyde_auth';

/**
 * Hook that monitors user activity and triggers automatic logout
 * after 30 minutes of inactivity for sessions without "Remember Me".
 *
 * Activity events: mouse movement, key presses, clicks, scrolls, touch.
 * On timeout: dispatches logout, clears localStorage, redirects to /login.
 */
export function useSessionTimeout() {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const dispatch = useAppDispatch();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isRememberMe = useCallback((): boolean => {
    try {
      return localStorage.getItem(REMEMBER_ME_KEY) === 'true';
    } catch {
      return false;
    }
  }, []);

  const updateLastActivity = useCallback(() => {
    try {
      localStorage.setItem(SESSION_LAST_ACTIVITY_KEY, Date.now().toString());
    } catch {
      // Silently ignore storage errors
    }
  }, []);

  const performSessionLogout = useCallback(() => {
    // Clear all auth-related storage
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(REMEMBER_ME_KEY);
    localStorage.removeItem(SESSION_LAST_ACTIVITY_KEY);

    // Dispatch logout to clear Redux state
    dispatch(logoutAction());

    // Redirect to login — use window.location for a clean redirect
    // (avoids needing useNavigate which requires Router context timing)
    window.location.href = '/login';
  }, [dispatch]);

  const resetTimer = useCallback(() => {
    // Don't set timers for "Remember Me" sessions
    if (isRememberMe()) return;

    updateLastActivity();

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      performSessionLogout();
    }, SESSION_TIMEOUT_MS);
  }, [isRememberMe, updateLastActivity, performSessionLogout]);

  useEffect(() => {
    if (!isAuthenticated) {
      // Clean up timers when not authenticated
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    // Skip timeout for "Remember Me" sessions
    if (isRememberMe()) return;

    // Check if session already expired (e.g. page reload after long idle)
    const lastActivity = localStorage.getItem(SESSION_LAST_ACTIVITY_KEY);
    if (lastActivity) {
      const elapsed = Date.now() - parseInt(lastActivity, 10);
      if (elapsed >= SESSION_TIMEOUT_MS) {
        performSessionLogout();
        return;
      }
    }

    // Start the inactivity timer
    resetTimer();

    // Listen for user activity events
    const activityEvents: Array<keyof WindowEventMap> = [
      'mousemove',
      'keydown',
      'click',
      'scroll',
      'touchstart',
    ];

    // Throttle activity event handler to avoid excessive resets
    let lastReset = Date.now();
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastReset > 5000) {
        // Only reset every 5 seconds max
        lastReset = now;
        resetTimer();
      }
    };

    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Periodic check for cross-tab session expiry
    intervalRef.current = setInterval(() => {
      if (isRememberMe()) return;
      const stored = localStorage.getItem(SESSION_LAST_ACTIVITY_KEY);
      if (stored) {
        const elapsed = Date.now() - parseInt(stored, 10);
        if (elapsed >= SESSION_TIMEOUT_MS) {
          performSessionLogout();
        }
      }
    }, ACTIVITY_CHECK_INTERVAL_MS);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [isAuthenticated, isRememberMe, resetTimer, performSessionLogout]);
}
