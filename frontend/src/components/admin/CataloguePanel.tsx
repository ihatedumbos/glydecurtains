import { useState } from 'react';
import { Alert, Button, CircularProgress } from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import axiosInstance from '@/api/axiosInstance';
import { catalogueUrl } from '@/config/contact';
import { Panel } from '@/components/admin/AdminUi';

/** Public link to the catalogue, absolute so it works when pasted into WhatsApp. */
function publicCatalogueLink(): string {
  const url = catalogueUrl();
  return url.startsWith('http') ? url : `${window.location.origin}${url}`;
}

/**
 * Overview panel: make a fresh catalogue PDF from the current products once the owner has
 * finished adding them. The new PDF is downloaded here and also becomes the one customers get
 * from the website's "Download catalogue" links.
 */
export default function CataloguePanel() {
  const [busy, setBusy] = useState(false);
  const [madeAt, setMadeAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createPdf = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await axiosInstance.post('/catalogue/refresh', null, { responseType: 'blob', timeout: 120_000 });
      const blobUrl = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `Glyde-catalogue-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
      setMadeAt(new Date());
    } catch {
      setError('Could not create the PDF. Please try again in a minute.');
    } finally {
      setBusy(false);
    }
  };

  const shareText = `Glyde Curtain Track & Accessories catalogue (PDF): ${publicCatalogueLink()}`;

  return (
    <Panel
      title="Catalogue PDF"
      description="After adding or changing products, create a fresh PDF with every product's photo, price and an Order on WhatsApp button. Customers get the same PDF from the website."
    >
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="contained"
          onClick={createPdf}
          disabled={busy}
          startIcon={busy ? <CircularProgress size={18} color="inherit" /> : <PictureAsPdfIcon />}
        >
          {busy ? 'Creating PDF…' : 'Create catalogue PDF'}
        </Button>
        <Button
          variant="outlined"
          color="success"
          href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
          target="_blank"
          rel="noopener noreferrer"
          startIcon={<WhatsAppIcon />}
        >
          Share link on WhatsApp
        </Button>
        {madeAt && (
          <span className="text-sm text-[#4b5b63]">
            Created at {madeAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}. Check your downloads.
          </span>
        )}
      </div>
      {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
    </Panel>
  );
}
