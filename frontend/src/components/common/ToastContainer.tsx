import { useEffect } from 'react';
import { Snackbar, Alert, Stack } from '@mui/material';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { removeToast } from '@/store/slices/uiSlice';

const AUTO_DISMISS_MS = 5000;

export default function ToastContainer() {
  const toasts = useAppSelector((state) => state.ui.toasts);
  const dispatch = useAppDispatch();

  // Auto-dismiss toasts after timeout
  useEffect(() => {
    if (toasts.length === 0) return;

    const latestToast = toasts[toasts.length - 1];
    const timer = setTimeout(() => {
      dispatch(removeToast(latestToast.id));
    }, AUTO_DISMISS_MS);

    return () => clearTimeout(timer);
  }, [toasts, dispatch]);

  if (toasts.length === 0) return null;

  return (
    <Stack
      spacing={1}
      sx={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 9999,
        maxWidth: 400,
      }}
    >
      {toasts.map((toast) => (
        <Snackbar
          key={toast.id}
          open
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          sx={{ position: 'relative', top: 'auto', right: 'auto' }}
        >
          <Alert
            severity={toast.type}
            variant="filled"
            onClose={() => dispatch(removeToast(toast.id))}
            sx={{ width: '100%', minWidth: 280 }}
          >
            {toast.message}
          </Alert>
        </Snackbar>
      ))}
    </Stack>
  );
}
