import { useEffect, useState } from 'react';
import { Box } from '@mui/material';
import { Outlet } from 'react-router-dom';
import axiosInstance from '@/api/axiosInstance';
import Header from './Header';
import Footer from './Footer';
import type { Category } from './MegaMenu';

const fallbackCategories: Category[] = [
  {
    id: 1,
    name: 'Curtains',
    slug: 'curtains',
    subCategories: [
      { id: 101, name: 'Eyelet', slug: 'eyelet' },
      { id: 102, name: 'Pleated', slug: 'pleated' },
      { id: 103, name: 'Rod Pocket', slug: 'rod-pocket' },
    ],
  },
  {
    id: 2,
    name: 'Accessories',
    slug: 'accessories',
    subCategories: [
      { id: 201, name: 'Rods', slug: 'rods' },
      { id: 202, name: 'Brackets', slug: 'brackets' },
      { id: 203, name: 'End Caps', slug: 'end-caps' },
    ],
  },
  {
    id: 3,
    name: 'Blinds',
    slug: 'blinds',
    subCategories: [
      { id: 301, name: 'Roman', slug: 'roman' },
      { id: 302, name: 'Roller', slug: 'roller' },
      { id: 303, name: 'Venetian', slug: 'venetian' },
    ],
  },
];

interface MainLayoutProps {
  categories?: Category[];
  onLogout?: () => void;
}

/**
 * Main public/customer layout with sticky header and footer.
 */
export default function MainLayout({ categories: providedCategories, onLogout }: MainLayoutProps) {
  const [categories, setCategories] = useState<Category[]>(providedCategories || fallbackCategories);

  useEffect(() => {
    if (providedCategories && providedCategories.length > 0) {
      setCategories(providedCategories);
      return;
    }

    let active = true;

    const fetchCategories = async () => {
      try {
        const response = await axiosInstance.get('/categories/public/tree');
        const data = response.data?.data || response.data || [];

        if (!Array.isArray(data) || data.length === 0) {
          setCategories(fallbackCategories);
          return;
        }

        const normalized = data.map((category: any) => ({
          id: category.id,
          name: category.name,
          slug: category.slug || category.name.toLowerCase().replace(/\s+/g, '-'),
          subCategories: (category.subCategories || category.children || []).map((sub: any) => ({
            id: sub.id,
            name: sub.name,
            slug: sub.slug || sub.name.toLowerCase().replace(/\s+/g, '-'),
          })),
        }));

        if (active) {
          setCategories(normalized);
        }
      } catch {
        if (active) {
          setCategories(fallbackCategories);
        }
      }
    };

    fetchCategories();

    return () => {
      active = false;
    };
  }, [providedCategories]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #f8fafc 0%, #f3f4f6 100%)',
      }}
    >
      <Header categories={categories} onLogout={onLogout} />
      <Box component="main" sx={{ flex: 1, background: 'transparent' }}>
        <Outlet />
      </Box>
      <Footer />
    </Box>
  );
}
