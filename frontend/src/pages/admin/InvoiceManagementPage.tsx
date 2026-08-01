import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  Switch,
  FormControlLabel,
  CircularProgress,
  Alert,
  Snackbar,
  Divider,
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import axiosInstance from '@/api/axiosInstance';

// ─── Types ──────────────────────────────────────────────────────────────────

interface InvoiceSettings {
  id: number | null;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  taxRegistrationNumber: string;
  footerText: string;
  termsText: string;
  numberFormat: string;
  includeLogoOnInvoice: boolean;
  enableCustomerDownload: boolean;
  nextSequenceNumber: number;
}

const defaultSettings: InvoiceSettings = {
  id: null,
  companyName: '',
  companyAddress: '',
  companyPhone: '',
  companyEmail: '',
  taxRegistrationNumber: '',
  footerText: '',
  termsText: '',
  numberFormat: 'INV-{YYYY}-{SEQ}',
  includeLogoOnInvoice: true,
  enableCustomerDownload: true,
  nextSequenceNumber: 1,
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function InvoiceManagementPage() {
  const [settings, setSettings] = useState<InvoiceSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // ─── Fetch Settings ─────────────────────────────────────────────────────

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/invoices/settings');
      const data = res.data.data;
      if (data) {
        setSettings({
          id: data.id ?? null,
          companyName: data.companyName ?? '',
          companyAddress: data.companyAddress ?? '',
          companyPhone: data.companyPhone ?? '',
          companyEmail: data.companyEmail ?? '',
          taxRegistrationNumber: data.taxRegistrationNumber ?? '',
          footerText: data.footerText ?? '',
          termsText: data.termsText ?? '',
          numberFormat: data.numberFormat ?? 'INV-{YYYY}-{SEQ}',
          includeLogoOnInvoice: data.includeLogoOnInvoice ?? true,
          enableCustomerDownload: data.enableCustomerDownload ?? true,
          nextSequenceNumber: data.nextSequenceNumber ?? 1,
        });
      }
    } catch {
      setSnackbar({ open: true, message: 'Failed to load invoice settings', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // ─── Save Settings ──────────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true);
    try {
      await axiosInstance.put('/invoices/settings', {
        companyName: settings.companyName,
        companyAddress: settings.companyAddress,
        companyPhone: settings.companyPhone,
        companyEmail: settings.companyEmail,
        taxRegistrationNumber: settings.taxRegistrationNumber,
        footerText: settings.footerText,
        termsText: settings.termsText,
        numberFormat: settings.numberFormat,
        includeLogoOnInvoice: settings.includeLogoOnInvoice,
        enableCustomerDownload: settings.enableCustomerDownload,
      });
      setSnackbar({ open: true, message: 'Invoice settings saved successfully', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Failed to save invoice settings', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // ─── Helpers ────────────────────────────────────────────────────────────

  const updateField = (field: keyof InvoiceSettings, value: string | boolean) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const getPreviewInvoiceNumber = (): string => {
    const format = settings.numberFormat || 'INV-{YYYY}-{SEQ}';
    const year = new Date().getFullYear().toString();
    const seq = String(settings.nextSequenceNumber).padStart(5, '0');
    return format
      .replace('{YYYY}', year)
      .replace('{YY}', year.slice(-2))
      .replace('{SEQ}', seq)
      .replace('{MM}', String(new Date().getMonth() + 1).padStart(2, '0'));
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
    <Box p={3}>
      <Box display="flex" alignItems="center" gap={1} mb={3}>
        <ReceiptIcon fontSize="large" color="primary" />
        <Typography variant="h4" fontWeight={700}>
          Invoice Settings
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* ─── Settings Form ───────────────────────────────────────────────── */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Company Information
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Company Name"
                  fullWidth
                  value={settings.companyName}
                  onChange={(e) => updateField('companyName', e.target.value)}
                  inputProps={{ maxLength: 200 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Company Address"
                  fullWidth
                  multiline
                  rows={2}
                  value={settings.companyAddress}
                  onChange={(e) => updateField('companyAddress', e.target.value)}
                  inputProps={{ maxLength: 500 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Phone"
                  fullWidth
                  value={settings.companyPhone}
                  onChange={(e) => updateField('companyPhone', e.target.value)}
                  inputProps={{ maxLength: 20 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email"
                  fullWidth
                  type="email"
                  value={settings.companyEmail}
                  onChange={(e) => updateField('companyEmail', e.target.value)}
                  inputProps={{ maxLength: 100 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Tax Registration Number"
                  fullWidth
                  value={settings.taxRegistrationNumber}
                  onChange={(e) => updateField('taxRegistrationNumber', e.target.value)}
                  inputProps={{ maxLength: 50 }}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" fontWeight={600} gutterBottom>
              Invoice Content
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Footer Text"
                  fullWidth
                  multiline
                  rows={2}
                  value={settings.footerText}
                  onChange={(e) => updateField('footerText', e.target.value)}
                  helperText="Displayed at the bottom of every invoice"
                  inputProps={{ maxLength: 500 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Terms & Conditions"
                  fullWidth
                  multiline
                  rows={3}
                  value={settings.termsText}
                  onChange={(e) => updateField('termsText', e.target.value)}
                  helperText="Payment terms and conditions shown on the invoice"
                  inputProps={{ maxLength: 2000 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Invoice Number Format"
                  fullWidth
                  value={settings.numberFormat}
                  onChange={(e) => updateField('numberFormat', e.target.value)}
                  helperText="Use {YYYY}, {YY}, {MM}, {SEQ} as placeholders"
                  inputProps={{ maxLength: 50 }}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" fontWeight={600} gutterBottom>
              Options
            </Typography>

            <Box display="flex" flexDirection="column" gap={1}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.includeLogoOnInvoice}
                    onChange={(e) => updateField('includeLogoOnInvoice', e.target.checked)}
                  />
                }
                label="Include company logo on invoice"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.enableCustomerDownload}
                    onChange={(e) => updateField('enableCustomerDownload', e.target.checked)}
                  />
                }
                label="Allow customers to download invoices"
              />
            </Box>

            <Box mt={3} display="flex" justifyContent="flex-end">
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={saving}
                size="large"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* ─── Invoice Preview ─────────────────────────────────────────────── */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, position: 'sticky', top: 24 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Invoice Preview
            </Typography>

            <Paper
              variant="outlined"
              sx={{
                p: 3,
                backgroundColor: '#fafafa',
                minHeight: 400,
              }}
            >
              {/* Header */}
              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                <Box>
                  {settings.includeLogoOnInvoice && (
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        backgroundColor: '#e0e0e0',
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 1,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        LOGO
                      </Typography>
                    </Box>
                  )}
                  <Typography variant="subtitle1" fontWeight={700}>
                    {settings.companyName || 'Company Name'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" component="div" sx={{ whiteSpace: 'pre-line' }}>
                    {settings.companyAddress || '123 Business Street\nCity, Country'}
                  </Typography>
                  {settings.companyPhone && (
                    <Typography variant="caption" color="text.secondary" component="div">
                      Tel: {settings.companyPhone}
                    </Typography>
                  )}
                  {settings.companyEmail && (
                    <Typography variant="caption" color="text.secondary" component="div">
                      {settings.companyEmail}
                    </Typography>
                  )}
                </Box>
                <Box textAlign="right">
                  <Typography variant="h6" fontWeight={700} color="primary">
                    INVOICE
                  </Typography>
                  <Typography variant="caption" color="text.secondary" component="div">
                    {getPreviewInvoiceNumber()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" component="div">
                    Date: {new Date().toLocaleDateString()}
                  </Typography>
                  {settings.taxRegistrationNumber && (
                    <Typography variant="caption" color="text.secondary" component="div">
                      Tax Reg: {settings.taxRegistrationNumber}
                    </Typography>
                  )}
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Sample line items */}
              <Box mb={2}>
                <Grid container sx={{ fontWeight: 600, mb: 1 }}>
                  <Grid item xs={6}>
                    <Typography variant="caption">Item</Typography>
                  </Grid>
                  <Grid item xs={2} textAlign="center">
                    <Typography variant="caption">Qty</Typography>
                  </Grid>
                  <Grid item xs={2} textAlign="right">
                    <Typography variant="caption">Price</Typography>
                  </Grid>
                  <Grid item xs={2} textAlign="right">
                    <Typography variant="caption">Total</Typography>
                  </Grid>
                </Grid>
                {[
                  { name: 'Blackout Curtains', qty: 2, price: 89.99 },
                  { name: 'Curtain Rod', qty: 1, price: 45.00 },
                ].map((item, idx) => (
                  <Grid container key={idx} sx={{ py: 0.5 }}>
                    <Grid item xs={6}>
                      <Typography variant="caption">{item.name}</Typography>
                    </Grid>
                    <Grid item xs={2} textAlign="center">
                      <Typography variant="caption">{item.qty}</Typography>
                    </Grid>
                    <Grid item xs={2} textAlign="right">
                      <Typography variant="caption">${item.price.toFixed(2)}</Typography>
                    </Grid>
                    <Grid item xs={2} textAlign="right">
                      <Typography variant="caption">${(item.qty * item.price).toFixed(2)}</Typography>
                    </Grid>
                  </Grid>
                ))}
                <Divider sx={{ my: 1 }} />
                <Grid container>
                  <Grid item xs={10} textAlign="right">
                    <Typography variant="caption" fontWeight={700}>
                      Total:
                    </Typography>
                  </Grid>
                  <Grid item xs={2} textAlign="right">
                    <Typography variant="caption" fontWeight={700}>
                      $224.98
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Footer */}
              {settings.termsText && (
                <Box mb={1}>
                  <Typography variant="caption" fontWeight={600}>
                    Terms & Conditions
                  </Typography>
                  <Typography variant="caption" color="text.secondary" component="div" sx={{ whiteSpace: 'pre-line' }}>
                    {settings.termsText}
                  </Typography>
                </Box>
              )}
              {settings.footerText && (
                <Box mt={1} textAlign="center">
                  <Typography variant="caption" color="text.secondary" fontStyle="italic">
                    {settings.footerText}
                  </Typography>
                </Box>
              )}
            </Paper>
          </Paper>
        </Grid>
      </Grid>

      {/* ─── Snackbar ────────────────────────────────────────────────────── */}
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
