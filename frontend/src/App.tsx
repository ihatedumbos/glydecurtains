import { createBrowserRouter, RouterProvider } from 'react-router-dom';
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

function Root() {
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
