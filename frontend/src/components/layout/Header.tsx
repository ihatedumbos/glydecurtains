import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Box,
  IconButton,
  Badge,
  InputBase,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { useAppSelector } from '@/store/hooks';
import { useLogout } from '@/hooks/useLogout';
import Logo from './Logo';
import MegaMenu, { type Category } from './MegaMenu';
import MobileDrawer from './MobileDrawer';
import LanguageSwitcher from '@/components/common/LanguageSwitcher';

interface HeaderProps {
  categories?: Category[];
}

export default function Header({ categories = [] }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const isAuthRoute = ['/login', '/register', '/forgot-password', '/reset-password'].includes(location.pathname);
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const cartItems = useAppSelector((state) => state.cart.items);
  const wishlistCount = useAppSelector((state) => state.wishlist.count);
  const { logout } = useLogout();

  const [searchQuery, setSearchQuery] = useState('');
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProfileAnchor(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileAnchor(null);
  };

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'EMPLOYEE';

  return (
    <>
      <AppBar
        position="sticky"
        color="default"
        elevation={0}
        sx={{
          bgcolor: 'rgba(255, 255, 255, 0.78)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Toolbar sx={{ gap: 1, px: { xs: 1, md: 3 }, minHeight: { xs: 64, md: 72 } }}>
          {/* Mobile hamburger */}
          {isMobile && (
            <IconButton
              edge="start"
              aria-label="Open menu"
              onClick={() => setDrawerOpen(true)}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Logo */}
          <Logo
            variant={isMobile ? 'mobile' : 'header'}
            size={isMobile ? 'sm' : 'md'}
            onClick={() => navigate('/')}
          />

          {/* Desktop Mega Menu trigger */}
          {!isMobile && !isAuthRoute && (
            <Box
              sx={{ position: 'relative', ml: 3 }}
              onMouseEnter={() => setMegaMenuOpen(true)}
              onMouseLeave={() => setMegaMenuOpen(false)}
            >
              <Box
                component="button"
                sx={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  color: 'text.primary',
                  py: 1,
                  px: 1.5,
                  borderRadius: 1,
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                Categories
              </Box>
              <MegaMenu
                categories={categories}
                open={megaMenuOpen}
                onClose={() => setMegaMenuOpen(false)}
              />
            </Box>
          )}

          {/* Search bar */}
          <Box
            component="form"
            onSubmit={handleSearch}
            sx={{
              display: 'flex',
              alignItems: 'center',
              flex: 1,
              maxWidth: { xs: 'unset', md: 400 },
              mx: { xs: 1, md: 3 },
              bgcolor: 'action.hover',
              borderRadius: 2,
              px: 1.5,
              py: 0.25,
            }}
          >
            <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} fontSize="small" />
            <InputBase
              placeholder="Search curtains, rods, accessories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ flex: 1, fontSize: '0.875rem' }}
              inputProps={{ 'aria-label': 'Search products' }}
            />
          </Box>

          {/* Action icons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {/* Language switcher */}
            {!isMobile && <LanguageSwitcher />}

            {/* Wishlist */}
            <Tooltip title="Wishlist">
              <IconButton
                aria-label="Wishlist"
                onClick={() => navigate('/wishlist')}
                size="small"
              >
                <Badge badgeContent={wishlistCount} color="error" max={99}>
                  <FavoriteBorderIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Cart */}
            <Tooltip title="Cart">
              <IconButton
                aria-label="Cart"
                onClick={() => navigate('/cart')}
                size="small"
              >
                <Badge badgeContent={cartCount} color="primary" max={99}>
                  <ShoppingCartOutlinedIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Profile / Login */}
            {isAuthenticated ? (
              <>
                <Tooltip title="Account">
                  <IconButton
                    aria-label="Account menu"
                    onClick={handleProfileMenuOpen}
                    size="small"
                  >
                    <PersonOutlineIcon />
                  </IconButton>
                </Tooltip>
                <Menu
                  anchorEl={profileAnchor}
                  open={Boolean(profileAnchor)}
                  onClose={handleProfileMenuClose}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                  <MenuItem
                    onClick={() => {
                      handleProfileMenuClose();
                      navigate('/profile');
                    }}
                  >
                    <ListItemIcon>
                      <AccountCircleIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="My Profile" />
                  </MenuItem>
                  {isAdmin && (
                    <MenuItem
                      onClick={() => {
                        handleProfileMenuClose();
                        navigate('/admin');
                      }}
                    >
                      <ListItemIcon>
                        <DashboardIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="Admin Dashboard" />
                    </MenuItem>
                  )}
                  <MenuItem
                    onClick={() => {
                      handleProfileMenuClose();
                      logout();
                    }}
                  >
                    <ListItemIcon>
                      <LogoutIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary="Logout" />
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Tooltip title="Login">
                <IconButton
                  aria-label="Login"
                  onClick={() => navigate('/login')}
                  size="small"
                >
                  <PersonOutlineIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile drawer */}
      <MobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        categories={categories}
        isAuthenticated={isAuthenticated}
        userName={user?.name}
      />
    </>
  );
}
