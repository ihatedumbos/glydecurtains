import { Box, Container, Grid, Typography, Link as MuiLink, IconButton, Divider, Stack } from '@mui/material';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import TwitterIcon from '@mui/icons-material/Twitter';
import YouTubeIcon from '@mui/icons-material/YouTube';
import PinterestIcon from '@mui/icons-material/Pinterest';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { Link, useNavigate } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import Logo from './Logo';

const quickLinks = [
  { label: 'About Us', path: '/pages/about-us' },
  { label: 'Contact Us', path: '/contact' },
  { label: 'Store Locator', path: '/store-locator' },
  { label: 'Privacy Policy', path: '/pages/privacy-policy' },
  { label: 'Terms & Conditions', path: '/pages/terms-and-conditions' },
  { label: 'Shipping & Returns', path: '/pages/shipping-returns' },
];

const categoryLinks = [
  { label: 'Curtains', path: '/categories/curtains' },
  { label: 'Curtain Rods', path: '/categories/curtain-rods' },
  { label: 'Tracks', path: '/categories/tracks' },
  { label: 'Accessories', path: '/categories/accessories' },
  { label: 'Blinds Accessories', path: '/categories/blinds-accessories' },
];

const socialIcons: Record<string, React.ReactNode> = {
  facebook: <FacebookIcon />,
  instagram: <InstagramIcon />,
  twitter: <TwitterIcon />,
  youtube: <YouTubeIcon />,
  pinterest: <PinterestIcon />,
};

export default function Footer() {
  const navigate = useNavigate();
  const settings = useAppSelector((state) => state.cms.settings);

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: 'background.paper',
        borderTop: 1,
        borderColor: 'divider',
        mt: 'auto',
        pt: 6,
        pb: 3,
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Brand column */}
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ mb: 2, opacity: 0.9 }}>
              <Logo variant="footer" size="sm" onClick={() => navigate('/')} />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 240 }}>
              Premium curtains, blinds, and window treatments for every home. Quality craftsmanship since 2010.
            </Typography>
            {/* Social links */}
            <Stack direction="row" spacing={0.5}>
              {settings?.socialLinks &&
                Object.entries(settings.socialLinks).map(([platform, url]) =>
                  socialIcons[platform] ? (
                    <IconButton
                      key={platform}
                      size="small"
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={platform}
                    >
                      {socialIcons[platform]}
                    </IconButton>
                  ) : null
                )}
              {/* Default social icons if no CMS settings */}
              {!settings?.socialLinks && (
                <>
                  <IconButton size="small" aria-label="Facebook">
                    <FacebookIcon />
                  </IconButton>
                  <IconButton size="small" aria-label="Instagram">
                    <InstagramIcon />
                  </IconButton>
                  <IconButton size="small" aria-label="Twitter">
                    <TwitterIcon />
                  </IconButton>
                </>
              )}
            </Stack>
          </Grid>

          {/* Quick Links */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Quick Links
            </Typography>
            <Stack spacing={0.75}>
              {quickLinks.map((link) => (
                <MuiLink
                  key={link.path}
                  component={Link}
                  to={link.path}
                  variant="body2"
                  color="text.secondary"
                  underline="hover"
                >
                  {link.label}
                </MuiLink>
              ))}
            </Stack>
          </Grid>

          {/* Category Links */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Categories
            </Typography>
            <Stack spacing={0.75}>
              {categoryLinks.map((link) => (
                <MuiLink
                  key={link.path}
                  component={Link}
                  to={link.path}
                  variant="body2"
                  color="text.secondary"
                  underline="hover"
                >
                  {link.label}
                </MuiLink>
              ))}
            </Stack>
          </Grid>

          {/* Contact Info & Newsletter placeholder */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Contact Us
            </Typography>
            <Stack spacing={1.5}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <LocationOnIcon fontSize="small" sx={{ color: 'text.secondary', mt: 0.25 }} />
                <Typography variant="body2" color="text.secondary">
                  {settings?.address || 'Glyde Curtains, Surat, Gujarat, India'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PhoneIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {settings?.contactPhone || '+91 98765 43210'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EmailIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                <Typography variant="body2" color="text.secondary">
                  {settings?.contactEmail || 'info@glydecurtains.com'}
                </Typography>
              </Box>
            </Stack>

            {/* Newsletter placeholder */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Newsletter
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Subscribe for updates and exclusive offers.
              </Typography>
              {/* Newsletter form will be implemented in a later task */}
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* Copyright */}
        <Typography variant="body2" color="text.secondary" align="center">
          © {new Date().getFullYear()} Glyde Curtains. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
}
