import { BrowserRouter } from 'react-router-dom';
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

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <BrowserRouter>
          <SessionTimeoutProvider>
            <div className="min-h-screen">
              <AppRoutes />
            </div>
            <ToastContainer />
          </SessionTimeoutProvider>
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
