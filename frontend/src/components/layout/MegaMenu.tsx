import { useState } from 'react';
import { Box, Paper, Typography, Grid, List, ListItemButton, ListItemText, Fade } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export interface SubCategory {
  id: number;
  name: string;
  slug?: string;
}

export interface Category {
  id: number;
  name: string;
  slug?: string;
  subCategories: SubCategory[];
}

interface MegaMenuProps {
  categories: Category[];
  open: boolean;
  onClose: () => void;
  anchorEl?: HTMLElement | null;
}

export default function MegaMenu({ categories, open, onClose }: MegaMenuProps) {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<number | null>(
    categories.length > 0 ? categories[0].id : null
  );

  const activeCat = categories.find((c) => c.id === activeCategory);

  const handleCategoryClick = (categoryId: number, slug?: string) => {
    navigate(`/categories/${slug || categoryId}`);
    onClose();
  };

  const handleSubCategoryClick = (categorySlug: string | undefined, subSlug: string | undefined, subId: number) => {
    navigate(`/categories/${categorySlug || 'all'}/${subSlug || subId}`);
    onClose();
  };

  if (!open) return null;

  return (
    <Fade in={open}>
      <Paper
        elevation={8}
        onMouseLeave={onClose}
        sx={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          zIndex: 1200,
          borderRadius: 2,
          overflow: 'hidden',
          maxWidth: 900,
          mx: 'auto',
        }}
      >
        <Grid container>
          {/* Category list */}
          <Grid item xs={4} sx={{ borderRight: 1, borderColor: 'divider', bgcolor: 'action.hover' }}>
            <List dense disablePadding>
              {categories.map((category) => (
                <ListItemButton
                  key={category.id}
                  selected={activeCategory === category.id}
                  onMouseEnter={() => setActiveCategory(category.id)}
                  onClick={() => handleCategoryClick(category.id, category.slug)}
                >
                  <ListItemText
                    primary={category.name}
                    primaryTypographyProps={{ fontWeight: activeCategory === category.id ? 600 : 400 }}
                  />
                </ListItemButton>
              ))}
            </List>
          </Grid>

          {/* Sub-categories */}
          <Grid item xs={8}>
            <Box sx={{ p: 2, minHeight: 200 }}>
              {activeCat && (
                <>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    {activeCat.name}
                  </Typography>
                  <Grid container spacing={1}>
                    {activeCat.subCategories.map((sub) => (
                      <Grid item xs={6} key={sub.id}>
                        <ListItemButton
                          onClick={() => handleSubCategoryClick(activeCat.slug, sub.slug, sub.id)}
                          sx={{ borderRadius: 1 }}
                        >
                          <ListItemText primary={sub.name} />
                        </ListItemButton>
                      </Grid>
                    ))}
                    {activeCat.subCategories.length === 0 && (
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                          No sub-categories available
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Fade>
  );
}
