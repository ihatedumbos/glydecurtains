import { useEffect, useMemo, useState } from 'react';
import {
  Alert, Button, Checkbox, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControlLabel, Switch, TextField,
} from '@mui/material';
import axiosInstance from '@/api/axiosInstance';

export interface QuoteProduct {
  id: number;
  name: string;
  internalName?: string | null;
  sku: string;
  categoryName?: string | null;
}

type Format = 'pdf' | 'csv';

/**
 * "Ask suppliers for rates": pick products and download a quotation sheet (PDF or CSV) that lists
 * every specification, also the rows hidden from customers, with empty columns for the supplier's rate.
 */
export default function SupplierQuoteDialog({
  open,
  onClose,
  products,
  initiallySelected,
}: {
  open: boolean;
  onClose: () => void;
  products: QuoteProduct[];
  initiallySelected: number[];
}) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [supplierName, setSupplierName] = useState('');
  const [note, setNote] = useState('');
  const [includePrices, setIncludePrices] = useState(false);
  const [busy, setBusy] = useState<Format | 'share' | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) { setSelected(new Set(initiallySelected)); setError(''); }
    // Only when the dialog opens: later list changes must not undo the admin's picks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const groups = useMemo(() => {
    const byCategory = new Map<string, QuoteProduct[]>();
    [...products]
      .sort((a, b) => (a.categoryName ?? '').localeCompare(b.categoryName ?? '') || a.name.localeCompare(b.name, undefined, { numeric: true }))
      .forEach((p) => {
        const key = p.categoryName || 'Other';
        byCategory.set(key, [...(byCategory.get(key) ?? []), p]);
      });
    return [...byCategory.entries()];
  }, [products]);

  const toggle = (ids: number[], on: boolean) => setSelected((s) => {
    const next = new Set(s);
    ids.forEach((id) => (on ? next.add(id) : next.delete(id)));
    return next;
  });

  const fetchFile = async (format: Format) => {
    const res = await axiosInstance.post(`/products/supplier-quote/${format}`, {
      productIds: [...selected], includePrices, supplierName, note,
    }, { responseType: 'blob' });
    const date = new Date().toISOString().slice(0, 10);
    const who = supplierName.trim() ? `-${supplierName.trim().replace(/[^\w-]+/g, '-')}` : '';
    return new File([res.data], `Glyde-quotation-request${who}-${date}.${format}`, {
      type: format === 'pdf' ? 'application/pdf' : 'text/csv',
    });
  };

  const download = async (format: Format) => {
    setBusy(format); setError('');
    try {
      const file = await fetchFile(format);
      const url = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch {
      setError('Could not create the file. Please try again.');
    } finally {
      setBusy(null);
    }
  };

  // On a phone, sharing hands the PDF straight to WhatsApp or email.
  const canShareFiles = typeof navigator !== 'undefined' && typeof navigator.canShare === 'function'
    && navigator.canShare({ files: [new File([''], 'x.pdf', { type: 'application/pdf' })] });

  const share = async () => {
    setBusy('share'); setError('');
    try {
      const file = await fetchFile('pdf');
      await navigator.share({ files: [file], title: 'Request for quotation' });
    } catch (e) {
      if ((e as Error)?.name !== 'AbortError') setError('Could not share the file. Try Download PDF instead.');
    } finally {
      setBusy(null);
    }
  };

  const none = selected.size === 0;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" scroll="paper">
      <DialogTitle>Ask suppliers for rates</DialogTitle>
      <DialogContent dividers>
        <p className="mb-4 text-sm text-[#4b5b63]">
          Choose the products to send. The sheet lists every specification, also the rows hidden from customers,
          with empty columns where the supplier writes their rate.
        </p>

        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          <TextField size="small" label="Supplier name (optional)" value={supplierName} onChange={(e) => setSupplierName(e.target.value)} />
          <FormControlLabel
            control={<Switch checked={includePrices} onChange={(e) => setIncludePrices(e.target.checked)} />}
            label={<span className="text-sm">Show our selling prices</span>}
          />
          <TextField
            size="small" label="Note for the supplier (optional)" placeholder="e.g. Rates for 100 pieces, delivery to Pune"
            value={note} onChange={(e) => setNote(e.target.value)} multiline minRows={2} className="sm:col-span-2"
          />
        </div>

        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-[#14232b]">{selected.size} of {products.length} products</span>
          <div className="flex gap-1">
            <Button size="small" onClick={() => toggle(products.map((p) => p.id), true)}>All</Button>
            <Button size="small" onClick={() => setSelected(new Set())}>None</Button>
          </div>
        </div>

        <div className="max-h-[40vh] overflow-y-auto rounded-lg border border-[#14232b]/10">
          {groups.map(([category, items]) => {
            const ids = items.map((p) => p.id);
            const picked = ids.filter((id) => selected.has(id)).length;
            return (
              <div key={category} className="border-b border-[#14232b]/8 last:border-b-0">
                <label className="flex cursor-pointer items-center bg-[#f7f8f9] px-2 py-1">
                  <Checkbox
                    size="small"
                    checked={picked === ids.length}
                    indeterminate={picked > 0 && picked < ids.length}
                    onChange={(e) => toggle(ids, e.target.checked)}
                  />
                  <span className="text-sm font-semibold text-[#14232b]">{category}</span>
                  <span className="ml-2 font-mono text-xs text-[#4b5b63]">{picked}/{ids.length}</span>
                </label>
                {items.map((p) => (
                  <label key={p.id} className="flex cursor-pointer items-center px-2 py-0.5 pl-6 hover:bg-[#f7f8f9]">
                    <Checkbox size="small" checked={selected.has(p.id)} onChange={(e) => toggle([p.id], e.target.checked)} />
                    <span className="min-w-0 truncate text-sm text-[#14232b]">
                      {p.name}
                      {p.internalName && <span className="text-[#4b5b63]"> · {p.internalName}</span>}
                    </span>
                    <span className="ml-auto hidden pl-2 font-mono text-xs text-[#4b5b63] sm:inline">{p.sku}</span>
                  </label>
                ))}
              </div>
            );
          })}
        </div>

        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </DialogContent>
      <DialogActions sx={{ flexWrap: 'wrap', gap: 1, px: 3, py: 2 }}>
        <Button onClick={onClose} sx={{ mr: 'auto' }}>Close</Button>
        <Button variant="outlined" disabled={none || !!busy} onClick={() => download('csv')} startIcon={busy === 'csv' ? <CircularProgress size={14} /> : null}>
          Download CSV
        </Button>
        {canShareFiles && (
          <Button variant="outlined" disabled={none || !!busy} onClick={share} startIcon={busy === 'share' ? <CircularProgress size={14} /> : null}>
            Share PDF
          </Button>
        )}
        <Button variant="contained" disabled={none || !!busy} onClick={() => download('pdf')} startIcon={busy === 'pdf' ? <CircularProgress size={14} /> : null}>
          Download PDF
        </Button>
      </DialogActions>
    </Dialog>
  );
}
