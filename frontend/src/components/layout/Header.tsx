import { useState } from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Box,
  Button,
  IconButton,
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
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { whatsappLink } from '@/config/contact';
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
  const { logout } = useLogout();

  const [searchQuery, setSearchQuery] = useState('');
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null);


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setProfileAnchor(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileAnchor(null);
  };

  const navLinkSx = {
    fontSize: '0.95rem',
    fontWeight: 600,
    color: 'text.primary',
    py: 1,
    px: 1.25,
    borderRadius: 1,
    whiteSpace: 'nowrap',
    '&:hover': { color: 'primary.main' },
  } as const;

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'EMPLOYEE';

  return (
    <>
      <AppBar
        position="sticky"
        color="default"
        elevation={0}
        sx={{
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Toolbar sx={{ gap: { xs: 1, md: 2 }, px: { xs: 1, md: 4 }, minHeight: { xs: 64, md: 76 } }}>
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

          {/* Search bar */}
          <Box
            component="form"
            onSubmit={handleSearch}
            sx={{
              display: 'flex',
              alignItems: 'center',
              flex: 1,
              maxWidth: { xs: 'unset', md: 520 },
              minHeight: 46,
              mx: { xs: 0.5, md: 0 },
              bgcolor: '#ffffff',
              border: '1.5px solid #c7d0d5',
              borderRadius: 2,
              px: 1.5,
              '&:focus-within': { borderColor: 'primary.main' },
            }}
          >
            <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} fontSize="small" />
            <InputBase
              placeholder={isMobile ? 'Search products' : 'Search by product name or size, e.g. 20# wall'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ flex: 1, fontSize: '0.95rem' }}
              inputProps={{ 'aria-label': 'Search products' }}
            />
          </Box>

          {/* Desktop Mega Menu trigger */}
          {!isMobile && !isAuthRoute && (
            <Box
              sx={{ position: 'relative' }}
              onMouseEnter={() => setMegaMenuOpen(true)}
              onMouseLeave={() => setMegaMenuOpen(false)}
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setMegaMenuOpen(false);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setMegaMenuOpen(false);
              }}
            >
              <Box
                component="button"
                type="button"
                aria-haspopup="true"
                aria-expanded={megaMenuOpen}
                onFocus={() => setMegaMenuOpen(true)}
                onClick={() => setMegaMenuOpen((open) => !open)}
                sx={{
                  ...navLinkSx,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Catalogue
              </Box>
              <MegaMenu
                categories={categories}
                open={megaMenuOpen}
                onClose={() => setMegaMenuOpen(false)}
              />
            </Box>
          )}
          {!isMobile && !isAuthRoute && (
            <Box component="nav" aria-label="Main" sx={{ display: 'flex' }}>
              <Box component={RouterLink} to="/stores" sx={navLinkSx}>Store</Box>
              <Box component={RouterLink} to="/pages/about-us" sx={navLinkSx}>About</Box>
              <Box component={RouterLink} to="/contact" sx={navLinkSx}>Contact</Box>
            </Box>
          )}

          {/* Action icons, pinned to the right edge */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
            {/* Language switcher */}
            {!isMobile && <LanguageSwitcher />}

            {!isMobile && (
              <Button
                variant="contained"
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                startIcon={<WhatsAppIcon />}
                sx={{
                  minHeight: 46,
                  px: 2.25,
                  fontWeight: 700,
                  bgcolor: '#1a7f45',
                  color: '#ffffff',
                  '&:hover': { bgcolor: '#14663a' },
                }}
              >
                WhatsApp
              </Button>
            )}

            {/* Profile / Login */}
            {isAuthenticated ? (
              <>
                <Tooltip title="Account">
                  <IconButton
                    aria-label="Account menu"
                    onClick={handleProfileMenuOpen}
                  sx={{
                    border: '1.5px solid #c7d0d5',
                    borderRadius: 2,
                    width: 46,
                    height: 46,
                    color: 'text.primary',
                    '&:hover': { borderColor: 'primary.main', color: 'primary.main' },
                  }}
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
                  sx={{
                    border: '1.5px solid #c7d0d5',
                    borderRadius: 2,
                    width: 46,
                    height: 46,
                    color: 'text.primary',
                    '&:hover': { borderColor: 'primary.main', color: 'primary.main' },
                  }}
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
