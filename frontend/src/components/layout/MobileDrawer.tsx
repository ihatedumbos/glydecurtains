import {
  Drawer,
  Box,
  List,
  ListItemButton,
  ListItemText,
  Collapse,
  IconButton,
  Divider,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from './Logo';
import type { Category } from './MegaMenu';

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  isAuthenticated: boolean;
  userName?: string;
}

export default function MobileDrawer({
  open,
  onClose,
  categories,
  isAuthenticated,
  userName,
}: MobileDrawerProps) {
  const navigate = useNavigate();
  const [expandedCategory, setExpandedCategory] = useState<number | null>(null);

  const handleToggle = (catId: number) => {
    setExpandedCategory((prev) => (prev === catId ? null : catId));
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: '85vw', sm: 320 } },
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2 }}>
        <Logo variant="mobile" size="sm" onClick={() => handleNavigate('/')} />
        <IconButton onClick={onClose} aria-label="Close menu">
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider />

      {/* User greeting */}
      {isAuthenticated && userName && (
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="body2" color="text.secondary">
            Hello, {userName}
          </Typography>
        </Box>
      )}

      {/* Navigation */}
      <List disablePadding>
        <ListItemButton onClick={() => handleNavigate('/')}>
          <ListItemText primary="Home" />
        </ListItemButton>

        {/* Categories with sub-categories */}
        {categories.map((category) => (
          <Box key={category.id}>
            <ListItemButton onClick={() => handleToggle(category.id)}>
              <ListItemText primary={category.name} />
              {category.subCategories.length > 0 &&
                (expandedCategory === category.id ? <ExpandLessIcon /> : <ExpandMoreIcon />)}
            </ListItemButton>
            {category.subCategories.length > 0 && (
              <Collapse in={expandedCategory === category.id} timeout="auto" unmountOnExit>
                <List disablePadding sx={{ pl: 3 }}>
                  <ListItemButton
                    onClick={() => handleNavigate(`/categories/${category.slug || category.id}`)}
                  >
                    <ListItemText primary={`All ${category.name}`} primaryTypographyProps={{ fontSize: '0.875rem' }} />
                  </ListItemButton>
                  {category.subCategories.map((sub) => (
                    <ListItemButton
                      key={sub.id}
                      onClick={() =>
                        handleNavigate(
                          `/categories/${category.slug || category.id}/${sub.slug || sub.id}`
                        )
                      }
                    >
                      <ListItemText primary={sub.name} primaryTypographyProps={{ fontSize: '0.875rem' }} />
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>
            )}
          </Box>
        ))}

        <Divider sx={{ my: 1 }} />

        <ListItemButton onClick={() => handleNavigate('/store-locator')}>
          <ListItemText primary="Store Locator" />
        </ListItemButton>

        <ListItemButton onClick={() => handleNavigate('/contact')}>
          <ListItemText primary="Contact Us" />
        </ListItemButton>

        {!isAuthenticated && (
          <>
            <Divider sx={{ my: 1 }} />
            <ListItemButton onClick={() => handleNavigate('/login')}>
              <ListItemText primary="Login" />
            </ListItemButton>
            <ListItemButton onClick={() => handleNavigate('/register')}>
              <ListItemText primary="Register" />
            </ListItemButton>
          </>
        )}
      </List>
    </Drawer>
  );
}
