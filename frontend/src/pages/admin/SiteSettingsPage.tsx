import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  CircularProgress,
  Alert,
  Snackbar,
  Divider,
  IconButton,
  Grid,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Save as SaveIcon,
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Campaign as AnnouncementIcon,
} from '@mui/icons-material';
import axiosInstance from '@/api/axiosInstance';

// ─── Types ──────────────────────────────────────────────────────────────────

interface SiteSettings {
  id: number;
  logoHeaderBase64: string | null;
  logoFooterBase64: string | null;
  logoMobileBase64: string | null;
  logoAdminBase64: string | null;
  faviconBase64: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  socialLinks: string | null;
  announcementBar: string | null;
  activeThemeId: number | null;
  updatedAt: string | null;
}

interface SocialLinks {
  facebook: string;
  instagram: string;
  twitter: string;
  pinterest: string;
  youtube: string;
  linkedin: string;
}

interface LogoField {
  key: keyof Pick<SiteSettings, 'logoHeaderBase64' | 'logoFooterBase64' | 'logoMobileBase64' | 'logoAdminBase64' | 'faviconBase64'>;
  label: string;
  description: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const LOGO_FIELDS: LogoField[] = [
  { key: 'logoHeaderBase64', label: 'Header Logo', description: 'Displayed in the site header navigation' },
  { key: 'logoFooterBase64', label: 'Footer Logo', description: 'Displayed in the site footer' },
  { key: 'logoMobileBase64', label: 'Mobile Logo', description: 'Displayed on mobile devices' },
  { key: 'logoAdminBase64', label: 'Admin Logo', description: 'Displayed in the admin panel sidebar' },
  { key: 'faviconBase64', label: 'Favicon', description: 'Browser tab icon (recommended: 32x32 or 64x64)' },
];

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

const EMPTY_SOCIAL_LINKS: SocialLinks = {
  facebook: '',
  instagram: '',
  twitter: '',
  pinterest: '',
  youtube: '',
  linkedin: '',
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function SiteSettingsPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Form state
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [address, setAddress] = useState('');
  const [socialLinks, setSocialLinks] = useState<SocialLinks>(EMPTY_SOCIAL_LINKS);
  const [announcementBar, setAnnouncementBar] = useState('');
  const [logos, setLogos] = useState<Record<string, string | null>>({
    logoHeaderBase64: null,
    logoFooterBase64: null,
    logoMobileBase64: null,
    logoAdminBase64: null,
    faviconBase64: null,
  });

  // ─── Fetch Settings ───────────────────────────────────────────────────────

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/cms/settings');
      const data: SiteSettings = res.data.data;
      setSettings(data);
      setContactEmail(data.contactEmail || '');
      setContactPhone(data.contactPhone || '');
      setAddress(data.address || '');
      setAnnouncementBar(data.announcementBar || '');
      setLogos({
        logoHeaderBase64: data.logoHeaderBase64 || null,
        logoFooterBase64: data.logoFooterBase64 || null,
        logoMobileBase64: data.logoMobileBase64 || null,
        logoAdminBase64: data.logoAdminBase64 || null,
        faviconBase64: data.faviconBase64 || null,
      });

      // Parse social links JSON
      if (data.socialLinks) {
        try {
          const parsed = JSON.parse(data.socialLinks);
          setSocialLinks({ ...EMPTY_SOCIAL_LINKS, ...parsed });
        } catch {
          setSocialLinks(EMPTY_SOCIAL_LINKS);
        }
      } else {
        setSocialLinks(EMPTY_SOCIAL_LINKS);
      }
    } catch {
      setSnackbar({ open: true, message: 'Failed to load site settings', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // ─── Image Upload Handler ─────────────────────────────────────────────────

  const handleImageUpload = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setSnackbar({
        open: true,
        message: 'Invalid format. Allowed: PNG, JPEG, SVG, WebP',
        severity: 'error',
      });
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setSnackbar({
        open: true,
        message: 'File too large. Maximum size is 2MB',
        severity: 'error',
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setLogos((prev) => ({ ...prev, [field]: base64 }));
    };
    reader.readAsDataURL(file);

    // Reset the input value so the same file can be re-selected
    e.target.value = '';
  };

  const handleRemoveLogo = (field: string) => {
    setLogos((prev) => ({ ...prev, [field]: null }));
  };

  // ─── Save Settings ────────────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        logoHeaderBase64: logos.logoHeaderBase64 || null,
        logoFooterBase64: logos.logoFooterBase64 || null,
        logoMobileBase64: logos.logoMobileBase64 || null,
        logoAdminBase64: logos.logoAdminBase64 || null,
        faviconBase64: logos.faviconBase64 || null,
        contactEmail: contactEmail.trim() || null,
        contactPhone: contactPhone.trim() || null,
        address: address.trim() || null,
        socialLinks: JSON.stringify(socialLinks),
        announcementBar: announcementBar.trim() || null,
        activeThemeId: settings?.activeThemeId || null,
      };

      const res = await axiosInstance.put('/cms/settings', payload);
      const data: SiteSettings = res.data.data;
      setSettings(data);
      setSnackbar({ open: true, message: 'Settings saved successfully', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Failed to save settings', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3} maxWidth={1000} mx="auto">
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center" gap={1}>
          <SettingsIcon fontSize="large" color="primary" />
          <Typography variant="h4" fontWeight={700}>
            Site Settings
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </Box>

      {/* ─── Logo Management Section ─────────────────────────────────────── */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Logo Management
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Upload logos for different areas of your site. Accepted formats: PNG, JPEG, SVG, WebP. Max size: 2MB.
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          {LOGO_FIELDS.map((field) => (
            <Grid item xs={12} sm={6} key={field.key}>
              <Box
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  p: 2,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Typography variant="subtitle2" fontWeight={600}>
                  {field.label}
                </Typography>
                <Typography variant="caption" color="text.secondary" mb={1.5}>
                  {field.description}
                </Typography>

                {logos[field.key] ? (
                  <Box display="flex" alignItems="center" gap={1} mt="auto">
                    <Box
                      component="img"
                      src={logos[field.key]!}
                      alt={field.label}
                      sx={{
                        maxWidth: 120,
                        maxHeight: 60,
                        objectFit: 'contain',
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        p: 0.5,
                        backgroundColor: 'grey.50',
                      }}
                    />
                    <Box display="flex" flexDirection="column" gap={0.5}>
                      <Button variant="outlined" size="small" component="label">
                        Replace
                        <input
                          type="file"
                          hidden
                          accept=".png,.jpg,.jpeg,.svg,.webp"
                          onChange={handleImageUpload(field.key)}
                        />
                      </Button>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleRemoveLogo(field.key)}
                        title="Remove"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                ) : (
                  <Button
                    variant="outlined"
                    startIcon={<UploadIcon />}
                    component="label"
                    size="small"
                    sx={{ mt: 'auto', alignSelf: 'flex-start' }}
                  >
                    Upload
                    <input
                      type="file"
                      hidden
                      accept=".png,.jpg,.jpeg,.svg,.webp"
                      onChange={handleImageUpload(field.key)}
                    />
                  </Button>
                )}
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* ─── Contact Information Section ──────────────────────────────────── */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Contact Information
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Update your business contact details displayed on the site.
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Contact Email"
              type="email"
              fullWidth
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="info@example.com"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Contact Phone"
              fullWidth
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="+91 79 2345 6789"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Business Address"
              fullWidth
              multiline
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main Street, City, State, ZIP"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* ─── Social Links Section ─────────────────────────────────────────── */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Social Media Links
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Add links to your social media profiles. Leave blank to hide a platform.
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Facebook"
              fullWidth
              value={socialLinks.facebook}
              onChange={(e) => setSocialLinks((s) => ({ ...s, facebook: e.target.value }))}
              placeholder="https://facebook.com/yourpage"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Instagram"
              fullWidth
              value={socialLinks.instagram}
              onChange={(e) => setSocialLinks((s) => ({ ...s, instagram: e.target.value }))}
              placeholder="https://instagram.com/yourpage"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Twitter / X"
              fullWidth
              value={socialLinks.twitter}
              onChange={(e) => setSocialLinks((s) => ({ ...s, twitter: e.target.value }))}
              placeholder="https://twitter.com/yourhandle"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Pinterest"
              fullWidth
              value={socialLinks.pinterest}
              onChange={(e) => setSocialLinks((s) => ({ ...s, pinterest: e.target.value }))}
              placeholder="https://pinterest.com/yourpage"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="YouTube"
              fullWidth
              value={socialLinks.youtube}
              onChange={(e) => setSocialLinks((s) => ({ ...s, youtube: e.target.value }))}
              placeholder="https://youtube.com/@yourchannel"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="LinkedIn"
              fullWidth
              value={socialLinks.linkedin}
              onChange={(e) => setSocialLinks((s) => ({ ...s, linkedin: e.target.value }))}
              placeholder="https://linkedin.com/company/yourcompany"
            />
          </Grid>
        </Grid>
      </Paper>

      {/* ─── Announcement Bar Section ─────────────────────────────────────── */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <AnnouncementIcon color="primary" />
          <Typography variant="h6" fontWeight={600}>
            Announcement Bar
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Set a promotional message displayed at the top of your site. Leave empty to hide the bar.
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <TextField
          label="Announcement Text"
          fullWidth
          multiline
          rows={2}
          value={announcementBar}
          onChange={(e) => setAnnouncementBar(e.target.value)}
          placeholder="Free shipping on orders above ₹2000 | Use code WELCOME10 for 10% off"
          inputProps={{ maxLength: 500 }}
          helperText={`${announcementBar.length}/500 characters`}
        />

        {announcementBar && (
          <Box
            mt={2}
            p={1.5}
            sx={{
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
              borderRadius: 1,
              textAlign: 'center',
              fontSize: '0.875rem',
            }}
          >
            <Typography variant="body2" color="inherit">
              Preview: {announcementBar}
            </Typography>
          </Box>
        )}
      </Paper>

      {/* ─── Snackbar ──────────────────────────────────────────────────────── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
