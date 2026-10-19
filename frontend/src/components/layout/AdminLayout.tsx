import { useState } from 'react';
import { IconButton, Menu, MenuItem, ListItemIcon, Divider, useMediaQuery, useTheme } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import KeyOutlinedIcon from '@mui/icons-material/KeyOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Outlet, useLocation } from 'react-router-dom';
import { useLogout } from '@/hooks/useLogout';
import { useAppSelector } from '@/store/hooks';
import ChangePasswordDialog from '@/components/admin/ChangePasswordDialog';
import AdminSidebar from './AdminSidebar';
import { findAdminPage } from './adminNav';

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Owner',
  ADMIN: 'Manager',
  EMPLOYEE: 'Staff',
};

/**
 * Admin shell: slate sidebar with the menu, and a slim top bar with the page name, a link to the
 * website and the account menu (change password, sign out).
 */
export default function AdminLayout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accountAnchor, setAccountAnchor] = useState<HTMLElement | null>(null);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const { logout } = useLogout();
  const user = useAppSelector((state) => state.auth.user);
  const { pathname } = useLocation();
  const page = findAdminPage(pathname);
  const initials = (user?.name || user?.email || '?')
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex min-h-screen bg-[#f3f5f6] text-[#14232b]">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-[#14232b]/10 bg-white/95 px-3 backdrop-blur sm:px-6">
          {isMobile && (
            <IconButton edge="start" aria-label="Open menu" onClick={() => setSidebarOpen(true)}>
              <MenuIcon />
            </IconButton>
          )}
          <p className="min-w-0 flex-1 truncate text-sm font-semibold">{page?.label ?? 'Admin'}</p>

          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-[#4b5b63] hover:bg-[#14232b]/5 hover:text-[#14232b] sm:flex"
          >
            View website <OpenInNewIcon sx={{ fontSize: 15 }} />
          </a>

          <button
            type="button"
            onClick={(e) => setAccountAnchor(e.currentTarget)}
            className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 text-left hover:bg-[#14232b]/5"
            aria-haspopup="menu"
            aria-label="Account"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#a8400f] text-xs font-semibold text-white">{initials}</span>
            <span className="hidden leading-tight sm:block">
              <span className="block max-w-[10rem] truncate text-sm font-medium">{user?.name || user?.email}</span>
              <span className="block text-xs text-[#4b5b63]">{ROLE_LABELS[user?.role ?? ''] ?? user?.role}</span>
            </span>
            <ExpandMoreIcon sx={{ fontSize: 18, color: '#4b5b63' }} />
          </button>
          <Menu anchorEl={accountAnchor} open={Boolean(accountAnchor)} onClose={() => setAccountAnchor(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
            <div className="px-4 py-2 text-xs text-[#4b5b63]">Signed in as {user?.email}</div>
            <Divider />
            <MenuItem onClick={() => { setAccountAnchor(null); setPasswordOpen(true); }}>
              <ListItemIcon><KeyOutlinedIcon fontSize="small" /></ListItemIcon>
              Change password
            </MenuItem>
            <MenuItem onClick={() => { setAccountAnchor(null); logout(); }}>
              <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
              Sign out
            </MenuItem>
          </Menu>
        </header>

        <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>

      <ChangePasswordDialog open={passwordOpen} onClose={() => setPasswordOpen(false)} />
    </div>
  );
}
