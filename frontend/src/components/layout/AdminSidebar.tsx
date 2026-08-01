import {
  Drawer,
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import CategoryIcon from '@mui/icons-material/Category';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PeopleIcon from '@mui/icons-material/People';
import BadgeIcon from '@mui/icons-material/Badge';
import StoreIcon from '@mui/icons-material/Store';
import FeedbackIcon from '@mui/icons-material/Feedback';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import MailIcon from '@mui/icons-material/Mail';
import SettingsIcon from '@mui/icons-material/Settings';
import WebIcon from '@mui/icons-material/Web';
import PaletteIcon from '@mui/icons-material/Palette';
import SecurityIcon from '@mui/icons-material/Security';
import ReceiptIcon from '@mui/icons-material/Receipt';
import HistoryIcon from '@mui/icons-material/History';
import AssessmentIcon from '@mui/icons-material/Assessment';
import InventoryIcon from '@mui/icons-material/Inventory';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import usePermissions from '@/hooks/usePermissions';
import Logo from './Logo';

const DRAWER_WIDTH = 240;
const DRAWER_COLLAPSED_WIDTH = 64;

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  /** Role-based restriction (in addition to permissions) */
  roles?: Array<'SUPER_ADMIN' | 'ADMIN' | 'EMPLOYEE'>;
  /** Entity name for permission check (requires "read" permission) */
  permissionEntity?: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/admin', icon: <DashboardIcon />, permissionEntity: 'dashboard' },
  { label: 'Products', path: '/admin/products', icon: <ShoppingBagIcon />, permissionEntity: 'products' },
  { label: 'Categories', path: '/admin/categories', icon: <CategoryIcon />, permissionEntity: 'categories' },
  { label: 'Orders', path: '/admin/orders', icon: <ShoppingCartIcon />, permissionEntity: 'orders' },
  { label: 'Customers', path: '/admin/users', icon: <PeopleIcon />, roles: ['SUPER_ADMIN', 'ADMIN'], permissionEntity: 'users' },
  { label: 'Employees', path: '/admin/employees', icon: <BadgeIcon />, roles: ['SUPER_ADMIN', 'ADMIN'], permissionEntity: 'employees' },
  { label: 'Store Locations', path: '/admin/stores', icon: <StoreIcon />, permissionEntity: 'stores' },
  { label: 'Feedback', path: '/admin/feedback', icon: <FeedbackIcon />, permissionEntity: 'feedback' },
  { label: 'Achievements', path: '/admin/achievements', icon: <EmojiEventsIcon />, permissionEntity: 'achievements' },
  { label: 'Enquiries', path: '/admin/enquiries', icon: <MailIcon />, permissionEntity: 'enquiries' },
  { label: 'Invoices', path: '/admin/invoices', icon: <ReceiptIcon />, permissionEntity: 'invoices' },
  { label: 'Reports', path: '/admin/reports', icon: <AssessmentIcon />, permissionEntity: 'reports' },
  { label: 'Inventory', path: '/admin/inventory', icon: <InventoryIcon />, permissionEntity: 'inventory' },
  { label: 'CMS', path: '/admin/cms', icon: <WebIcon />, permissionEntity: 'cms' },
  { label: 'Themes', path: '/admin/themes', icon: <PaletteIcon />, permissionEntity: 'themes' },
  { label: 'Permissions', path: '/admin/permissions', icon: <SecurityIcon />, roles: ['SUPER_ADMIN', 'ADMIN'], permissionEntity: 'permissions' },
  { label: 'Activity Logs', path: '/admin/activity-logs', icon: <HistoryIcon />, roles: ['SUPER_ADMIN', 'ADMIN'], permissionEntity: 'activity-logs' },
  { label: 'Settings', path: '/admin/settings', icon: <SettingsIcon />, roles: ['SUPER_ADMIN'] },
];

interface AdminSidebarProps {
  open: boolean;
  collapsed?: boolean;
  onClose?: () => void;
}

export default function AdminSidebar({ open, collapsed = false, onClose }: AdminSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const user = useAppSelector((state) => state.auth.user);
  const { hasPermission, isSuperAdmin } = usePermissions();

  const userRole = user?.role;

  const filteredItems = navItems.filter((item) => {
    // Role-based filter
    if (item.roles) {
      if (!userRole) return false;
      if (!item.roles.includes(userRole as 'SUPER_ADMIN' | 'ADMIN' | 'EMPLOYEE')) return false;
    }

    // Permission-based filter: check "read" permission on the entity
    if (item.permissionEntity) {
      if (!hasPermission(item.permissionEntity, 'read')) return false;
    }

    return true;
  });

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  const drawerWidth = collapsed ? DRAWER_COLLAPSED_WIDTH : DRAWER_WIDTH;

  const content = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', p: 2 }}>
        <Logo variant="admin" size="sm" onClick={() => navigate('/admin')} />
      </Box>

      <Divider />

      {/* Navigation */}
      <List sx={{ flex: 1, px: 1, py: 1 }}>
        {filteredItems.map((item) => {
          const button = (
            <ListItemButton
              key={item.path}
              onClick={() => {
                navigate(item.path);
                if (isMobile) onClose?.();
              }}
              selected={isActive(item.path)}
              sx={{
                borderRadius: 1,
                mb: 0.5,
                justifyContent: collapsed ? 'center' : 'flex-start',
                px: collapsed ? 1.5 : 2,
              }}
            >
              <ListItemIcon sx={{ minWidth: collapsed ? 0 : 40 }}>
                {item.icon}
              </ListItemIcon>
              {!collapsed && <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: '0.875rem' }} />}
            </ListItemButton>
          );

          return collapsed ? (
            <Tooltip key={item.path} title={item.label} placement="right">
              {button}
            </Tooltip>
          ) : (
            button
          );
        })}
      </List>
    </Box>
  );

  // Mobile: temporary drawer
  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        PaperProps={{ sx: { width: DRAWER_WIDTH } }}
      >
        {content}
      </Drawer>
    );
  }

  // Desktop: permanent drawer
  return (
    <Drawer
      variant="permanent"
      open
      PaperProps={{
        sx: {
          width: drawerWidth,
          transition: 'width 0.2s ease',
          overflowX: 'hidden',
          position: 'relative',
        },
      }}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': { position: 'relative' },
      }}
    >
      {content}
    </Drawer>
  );
}
