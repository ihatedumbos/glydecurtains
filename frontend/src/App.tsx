import { useEffect } from 'react';
import { createBrowserRouter, RouterProvider, useLocation, useNavigationType } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import { ThemeProvider } from '@/theme';
import { AppRoutes } from '@/routes';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import ToastContainer from '@/components/common/ToastContainer';

function SessionTimeoutProvider({ children }: { children: React.ReactNode }) {
  useSessionTimeout();
  return <>{children}</>;
}

/** Opens every new page at the top. Back and forward keep the browser's own scroll position. */
function useScrollToTopOnNewPage() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();
  useEffect(() => {
    if (navigationType !== 'POP') window.scrollTo(0, 0);
  }, [pathname, navigationType]);
}

function Root() {
  useScrollToTopOnNewPage();
  return (
    <SessionTimeoutProvider>
      <div className="min-h-screen">
        <AppRoutes />
      </div>
      <ToastContainer />
    </SessionTimeoutProvider>
  );
}

// A data router, so pages can warn before leaving with unsaved changes (useBlocker).
const router = createBrowserRouter([{ path: '*', element: <Root /> }]);

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </Provider>
  );
}

export default App;
