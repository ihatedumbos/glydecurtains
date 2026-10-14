import { Box, Button, Container, Grid, Typography, Link as MuiLink, Divider, Stack } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { Link, useNavigate } from 'react-router-dom';
import { CONTACT, whatsappLink } from '@/config/contact';
import Logo from './Logo';

const quickLinks = [
  { label: 'About Us', path: '/pages/about-us' },
  { label: 'Contact Us', path: '/contact' },
  { label: 'Store Locator', path: '/stores' },
  { label: 'Privacy Policy', path: '/pages/privacy-policy' },
  { label: 'Terms & Conditions', path: '/pages/terms-and-conditions' },
];

const categoryLinks = [
  { label: 'Track Runners', path: '/categories/accessories/track-runners' },
  { label: 'Ceiling Fittings', path: '/categories/accessories/ceiling-fittings' },
  { label: 'Wall Fittings', path: '/categories/accessories/wall-fittings' },
  { label: 'End Caps', path: '/categories/accessories/end-caps' },
  { label: 'Curtain Tapes', path: '/categories/accessories/curtain-tapes' },
];

export default function Footer() {
  const navigate = useNavigate();

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
              Manufacturer-direct curtain tracks and accessories, made in Pune.
            </Typography>
            <Button
              variant="contained"
              size="small"
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              startIcon={<WhatsAppIcon />}
              sx={{ textTransform: 'none', fontWeight: 600, bgcolor: '#25D366', '&:hover': { bgcolor: '#1ebe5a' } }}
            >
              Chat on WhatsApp
            </Button>
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

          {/* Contact Info */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Contact Us
            </Typography>
            <Stack spacing={1.5}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <LocationOnIcon fontSize="small" sx={{ color: 'text.secondary', mt: 0.25 }} />
                <Typography variant="body2" color="text.secondary">
                  {CONTACT.address}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PhoneIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                <MuiLink href={`tel:${CONTACT.phoneDisplay.replace(/\s/g, '')}`} variant="body2" color="text.secondary" underline="hover">
                  {CONTACT.phoneDisplay}
                </MuiLink>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EmailIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                <MuiLink href={`mailto:${CONTACT.email}`} variant="body2" color="text.secondary" underline="hover">
                  {CONTACT.email}
                </MuiLink>
              </Box>
            </Stack>

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
