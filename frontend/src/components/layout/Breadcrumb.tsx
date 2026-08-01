import { Breadcrumbs, Link as MuiLink, Typography, Box } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import HomeIcon from '@mui/icons-material/Home';
import { Link, useLocation } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[];
  showHome?: boolean;
}

/**
 * Auto-generates breadcrumbs from the current route path,
 * or accepts explicit items for custom breadcrumb trails.
 */
export default function Breadcrumb({ items, showHome = true }: BreadcrumbProps) {
  const location = useLocation();

  // Auto-generate from path if no items provided
  const breadcrumbs: BreadcrumbItem[] = items || generateFromPath(location.pathname);

  if (breadcrumbs.length === 0 && !showHome) return null;

  return (
    <Box sx={{ py: 1.5, px: { xs: 2, md: 0 } }}>
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        aria-label="breadcrumb"
      >
        {showHome && (
          <MuiLink
            component={Link}
            to="/"
            color="text.secondary"
            underline="hover"
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            <HomeIcon fontSize="small" />
            Home
          </MuiLink>
        )}
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;

          if (isLast || !item.path) {
            return (
              <Typography key={index} color="text.primary" variant="body2" fontWeight={500}>
                {item.label}
              </Typography>
            );
          }

          return (
            <MuiLink
              key={index}
              component={Link}
              to={item.path}
              color="text.secondary"
              underline="hover"
              variant="body2"
            >
              {item.label}
            </MuiLink>
          );
        })}
      </Breadcrumbs>
    </Box>
  );
}

function generateFromPath(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);

  // Don't generate for root
  if (segments.length === 0) return [];

  return segments.map((segment, index) => {
    const path = '/' + segments.slice(0, index + 1).join('/');
    const label = segment
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

    return { label, path };
  });
}
