import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { store } from '@/store/store';
import { setAccessToken, logout } from '@/store/slices/authSlice';
import { addToast } from '@/store/slices/uiSlice';
import i18n from '@/i18n';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor ────────────────────────────────────────────────────

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Attach JWT access token from Redux store
    const { accessToken } = store.getState().auth;
    if (accessToken) {
      config.headers = {
        ...config.headers,
        Authorization: 'Bearer ' + accessToken,
      } as unknown as InternalAxiosRequestConfig['headers'];
    }

    // Inject Accept-Language header based on current i18n language
    const currentLanguage = i18n.language || 'en';
    config.headers = {
      ...config.headers,
      'Accept-Language': currentLanguage,
    } as unknown as InternalAxiosRequestConfig['headers'];

    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Server Wake-up Retry ────────────────────────────────────────────────────
// The backend runs on Render's free plan, which sleeps after 15 idle minutes.
// While it starts again (up to a few minutes) Render answers 429/502/503/504 or
// drops the connection. Page loads (GET requests) keep retrying quietly until
// it is up, instead of showing an error straight away.

const WAKE_UP_STATUSES = [429, 502, 503, 504];
const WAKE_UP_MAX_WAIT_MS = 4 * 60 * 1000;
const WAKE_UP_TOAST_ID = 'server-waking-up';

type RetryableConfig = InternalAxiosRequestConfig & { _wakeStartedAt?: number; _wakeAttempt?: number };

function isServerWaking(error: AxiosError): boolean {
  const config = error.config as RetryableConfig | undefined;
  if (!config || (config.method ?? 'get').toLowerCase() !== 'get') return false;
  if (error.response) return WAKE_UP_STATUSES.includes(error.response.status);
  return error.code !== AxiosError.ERR_CANCELED;
}

async function retryWhileWaking(error: AxiosError) {
  const config = error.config as RetryableConfig;
  config._wakeStartedAt ??= Date.now();
  config._wakeAttempt = (config._wakeAttempt ?? 0) + 1;
  if (Date.now() - config._wakeStartedAt > WAKE_UP_MAX_WAIT_MS) return null;

  const alreadyShown = store.getState().ui.toasts.some((t) => t.id === WAKE_UP_TOAST_ID);
  if (!alreadyShown) {
    store.dispatch(
      addToast({
        id: WAKE_UP_TOAST_ID,
        type: 'info',
        message: i18n.t('common:errors.serverWakingUp', 'Loading, one moment please…'),
      }),
    );
  }

  const delayMs = Math.min(3000 * config._wakeAttempt, 15000);
  await new Promise((resolve) => setTimeout(resolve, delayMs));
  return axiosInstance(config);
}

// ─── Response Interceptor ───────────────────────────────────────────────────

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string | null) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null): void {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (isServerWaking(error)) {
      const retried = await retryWhileWaking(error);
      if (retried) return retried;
    }

    // Handle 401 - attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      const { refreshToken } = store.getState().auth;

      // If no refresh token available, logout immediately
      if (!refreshToken) {
        store.dispatch(logout());
        localStorage.removeItem('glyde_auth');
        localStorage.removeItem('glyde_remember_me');
        localStorage.removeItem('glyde_last_activity');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue requests while refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token) => {
              if (token && originalRequest.headers) {
                originalRequest.headers = {
                  ...originalRequest.headers,
                  Authorization: 'Bearer ' + token,
                } as unknown as InternalAxiosRequestConfig['headers'];
              }
              resolve(axiosInstance(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Use a plain axios call to avoid interceptor loop
        const response = await axios.post(`${BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const newAccessToken: string = response.data.data?.accessToken || response.data.accessToken;

        if (!newAccessToken) {
          throw new Error('No access token in refresh response');
        }

        // Update Redux store with new access token
        store.dispatch(setAccessToken(newAccessToken));

        // Process queued requests with new token
        processQueue(null, newAccessToken);

        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers = {
            ...originalRequest.headers,
            Authorization: 'Bearer ' + newAccessToken,
          } as unknown as InternalAxiosRequestConfig['headers'];
        }
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh failed - clear auth and redirect to login
        processQueue(refreshError, null);
        store.dispatch(logout());
        localStorage.removeItem('glyde_auth');
        localStorage.removeItem('glyde_remember_me');
        localStorage.removeItem('glyde_last_activity');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // ─── Global Error Handling with Toast Notifications ───────────────────

    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as { message?: string; errorCode?: string } | undefined;
      const message = data?.message || getDefaultErrorMessage(status);

      // Don't show toast for 401 (already handled above)
      if (status !== 401) {
        store.dispatch(
          addToast({
            id: `error-${Date.now()}`,
            type: 'error',
            message,
          }),
        );
      }
    } else if (error.request) {
      // Network error - no response received
      store.dispatch(
        addToast({
          id: `network-error-${Date.now()}`,
          type: 'error',
          message: i18n.t('common:errors.networkError', 'Network error. Please check your connection.'),
        }),
      );
    }

    return Promise.reject(error);
  },
);

function getDefaultErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return i18n.t('common:errors.badRequest', 'Invalid request. Please check your input.');
    case 403:
      return i18n.t('common:errors.forbidden', 'You do not have permission to perform this action.');
    case 404:
      return i18n.t('common:errors.notFound', 'The requested resource was not found.');
    case 409:
      return i18n.t('common:errors.conflict', 'A conflict occurred. Please try again.');
    case 422:
      return i18n.t('common:errors.validation', 'Validation failed. Please check your input.');
    case 429:
      return i18n.t('common:errors.tooManyRequests', 'Too many requests. Please wait and try again.');
    case 500:
    default:
      return i18n.t('common:errors.serverError', 'An unexpected error occurred. Please try again later.');
  }
}

export default axiosInstance;
