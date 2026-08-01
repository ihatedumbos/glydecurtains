import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import type { Category } from './MegaMenu';

interface MainLayoutProps {
  categories?: Category[];
  onLogout?: () => void;
}

/**
 * Main public/customer layout with sticky header and footer.
 */
export default function MainLayout({ categories = [], onLogout }: MainLayoutProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header categories={categories} onLogout={onLogout} />
      <Box component="main" sx={{ flex: 1 }}>
        <Outlet />
      </Box>
      <Footer />
    </Box>
  );
}
