import { useState } from 'react';
import { Box, IconButton, AppBar, Toolbar, Typography, Button, useMediaQuery, useTheme } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import { Outlet } from 'react-router-dom';
import { useLogout } from '@/hooks/useLogout';
import AdminSidebar from './AdminSidebar';
import Breadcrumb from './Breadcrumb';

/**
 * Admin layout with sidebar navigation and top bar.
 */
export default function AdminLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { logout } = useLogout();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', px: { xs: 2, md: 3 }, pt: 1 }}>
          <Button size="small" color="inherit" startIcon={<LogoutIcon />} onClick={logout}>
            Logout
          </Button>
        </Box>
        {/* Top bar for mobile */}
        {isMobile && (
          <AppBar position="sticky" color="default" elevation={1}>
            <Toolbar>
              <IconButton
                edge="start"
                aria-label="Open sidebar"
                onClick={() => setSidebarOpen(true)}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
              <Typography variant="h6" noWrap>
                Admin Panel
              </Typography>
            </Toolbar>
          </AppBar>
        )}

        {/* Content */}
        <Box sx={{ flex: 1, p: { xs: 2, md: 3 }, overflow: 'auto' }}>
          <Breadcrumb />
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
