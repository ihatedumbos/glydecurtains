import { useState } from 'react';
import { Box, Paper, Typography, List, ListItemButton, ListItemText, Fade } from '@mui/material';
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
    <Fade in={open} unmountOnExit>
      <Paper
        elevation={8}
        onMouseLeave={onClose}
        sx={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          zIndex: 1200,
          borderRadius: 2,
          overflow: 'hidden',
          width: 640,
          maxWidth: '90vw',
          bgcolor: 'background.paper',
          border: 1,
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'stretch' }}>
          {/* Category list */}
          <Box
            sx={{
              width: 220,
              flexShrink: 0,
              borderRight: 1,
              borderColor: 'divider',
              bgcolor: 'action.hover',
            }}
          >
            <List dense disablePadding>
              {categories.map((category) => (
                <ListItemButton
                  key={category.id}
                  selected={activeCategory === category.id}
                  onMouseEnter={() => setActiveCategory(category.id)}
                  onClick={() => handleCategoryClick(category.id, category.slug)}
                  sx={{ py: 1.1 }}
                >
                  <ListItemText
                    primary={category.name}
                    primaryTypographyProps={{
                      fontWeight: activeCategory === category.id ? 600 : 400,
                      noWrap: true,
                    }}
                  />
                </ListItemButton>
              ))}
            </List>
          </Box>

          {/* Sub-categories */}
          <Box sx={{ flex: 1, minWidth: 0, p: 2, minHeight: 220 }}>
            {activeCat && (
              <>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  {activeCat.name}
                </Typography>
                {activeCat.subCategories.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No sub-categories available
                  </Typography>
                ) : (
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                      gap: 0.5,
                    }}
                  >
                    {activeCat.subCategories.map((sub) => (
                      <ListItemButton
                        key={sub.id}
                        onClick={() => handleSubCategoryClick(activeCat.slug, sub.slug, sub.id)}
                        sx={{ borderRadius: 1, minWidth: 0 }}
                      >
                        <ListItemText
                          primary={sub.name}
                          primaryTypographyProps={{ noWrap: true }}
                        />
                      </ListItemButton>
                    ))}
                  </Box>
                )}
              </>
            )}
          </Box>
        </Box>
      </Paper>
    </Fade>
  );
}
