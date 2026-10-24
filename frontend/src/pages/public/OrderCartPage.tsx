import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Alert, Button, Container, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, TextField, Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  MAX_QUANTITY, clearOrderCart, removeFromOrderCart, setOrderCartQuantity,
} from '@/store/slices/orderCartSlice';
import { buildOrderSummary, orderTotals, type OrderCustomer } from '@/utils/orderSummary';
import { CONTACT, useContact, whatsappLink } from '@/config/contact';
import { trackWhatsApp } from '@/utils/analytics';
import { resolveMediaUrl } from '@/utils/mediaUrl';
import { formatPrice } from '@/utils/price';
import { usePageMeta } from '@/hooks/usePageMeta';

const CUSTOMER_STORAGE_KEY = 'glyde_order_customer';

function loadCustomer(): OrderCustomer {
  try {
    const saved = JSON.parse(localStorage.getItem(CUSTOMER_STORAGE_KEY) || '{}');
    return { name: saved.name ?? '', phone: saved.phone ?? '', area: saved.area ?? '', note: '' };
  } catch {
    return { name: '', phone: '', area: '', note: '' };
  }
}

/**
 * The cart. Nothing is paid or stored here: "Place order on WhatsApp" opens a chat with the
 * shop with the order summary already typed, and the customer presses send.
 */
export default function OrderCartPage() {
  usePageMeta('Your cart');
  useContact();
  const dispatch = useAppDispatch();
  const items = useAppSelector((state) => state.orderCart.items);
  const [customer, setCustomer] = useState<OrderCustomer>(loadCustomer);
  const [nameError, setNameError] = useState(false);
  const [sentOpen, setSentOpen] = useState(false);
  const { total, unpriced, pieces } = orderTotals(items);

  const updateCustomer = (field: keyof OrderCustomer, value: string) => {
    setCustomer((c) => ({ ...c, [field]: value }));
    if (field === 'name' && value.trim()) setNameError(false);
  };

  const placeOrder = () => {
    if (!customer.name.trim()) {
      setNameError(true);
      document.getElementById('order-name')?.focus();
      return;
    }
    try {
      const { name, phone, area } = customer;
      localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify({ name, phone, area }));
    } catch {
      // Not remembering the details is fine.
    }
    const link = whatsappLink(buildOrderSummary(items, customer, window.location.origin));
    trackWhatsApp(link, 'Cart order');
    const opened = window.open(link, '_blank', 'noopener,noreferrer');
    if (!opened) window.location.href = link;
    setSentOpen(true);
  };

  if (items.length === 0) {
    return (
      <Container maxWidth="sm" className="py-16 text-center">
        <ShoppingCartOutlinedIcon sx={{ fontSize: 56, color: 'text.disabled' }} />
        <Typography variant="h5" component="h1" className="!mt-3 !font-semibold">Your cart is empty</Typography>
        <Typography color="text.secondary" className="!mt-2">
          Add products from the catalogue, then place your order on WhatsApp in one message.
        </Typography>
        <Button component={Link} to="/products" variant="contained" className="!mt-6">Browse products</Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" className="py-8">
      <Typography variant="h4" component="h1" className="!font-bold">Your cart</Typography>
      <Typography color="text.secondary" className="!mb-6 !mt-1">
        {pieces} piece{pieces === 1 ? '' : 's'}, {items.length} item{items.length === 1 ? '' : 's'}. No payment online: we confirm price, stock and delivery with you on WhatsApp.
      </Typography>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <ul className="divide-y divide-[#14232b]/10 rounded-xl border border-[#14232b]/10 bg-white">
          {items.map((item) => {
            const option = [item.size, item.color].filter(Boolean).join(', ');
            const img = resolveMediaUrl(item.imageUrl);
            return (
              <li key={item.key} className="flex gap-3 p-4">
                <Link to={`/products/${item.productId}`} className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-[#14232b]/10 bg-[#f3f5f6]">
                  {img && <img src={img} alt="" className="h-full w-full object-cover" loading="lazy" />}
                </Link>
                <div className="min-w-0 flex-1">
                  <Link to={`/products/${item.productId}`} className="font-medium text-[#14232b] hover:text-[#a8400f]">{item.name}</Link>
                  {option && <p className="text-sm text-[#4b5b63]">{option}</p>}
                  <p className="mt-0.5 font-mono text-sm">
                    {item.unitPrice > 0 ? `${formatPrice(item.unitPrice)} each` : 'Price on request'}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center rounded-lg border border-[#14232b]/20">
                      <IconButton size="small" aria-label={`One less ${item.name}`} disabled={item.quantity <= 1}
                        onClick={() => dispatch(setOrderCartQuantity({ key: item.key, quantity: item.quantity - 1 }))}>
                        <RemoveIcon fontSize="small" />
                      </IconButton>
                      <input
                        value={item.quantity}
                        inputMode="numeric"
                        aria-label={`Quantity of ${item.name}`}
                        onChange={(e) => {
                          const n = Number(e.target.value.replace(/\D/g, ''));
                          if (n > 0) dispatch(setOrderCartQuantity({ key: item.key, quantity: n }));
                        }}
                        className="w-12 border-0 bg-transparent text-center font-mono text-sm outline-none"
                      />
                      <IconButton size="small" aria-label={`One more ${item.name}`} disabled={item.quantity >= MAX_QUANTITY}
                        onClick={() => dispatch(setOrderCartQuantity({ key: item.key, quantity: item.quantity + 1 }))}>
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </div>
                    <div className="flex items-center gap-1">
                      {item.unitPrice > 0 && <span className="font-mono font-semibold">{formatPrice(item.unitPrice * item.quantity)}</span>}
                      <IconButton size="small" aria-label={`Remove ${item.name}`} onClick={() => dispatch(removeFromOrderCart(item.key))}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-xl border border-[#14232b]/10 bg-white p-5">
            <div className="flex items-baseline justify-between">
              <span className="text-[#4b5b63]">Total</span>
              <span className="font-mono text-xl font-bold">{total > 0 ? formatPrice(total) : 'On request'}</span>
            </div>
            {unpriced > 0 && total > 0 && (
              <p className="mt-1 text-sm text-[#4b5b63]">Plus {unpriced} item{unpriced === 1 ? '' : 's'} priced on request.</p>
            )}

            <div className="mt-5 space-y-3">
              <TextField id="order-name" label="Your name" required fullWidth size="small" value={customer.name}
                onChange={(e) => updateCustomer('name', e.target.value)} error={nameError}
                helperText={nameError ? 'Please add your name so we know who the order is from.' : undefined} />
              <TextField label="Phone (optional)" fullWidth size="small" value={customer.phone} inputMode="tel"
                onChange={(e) => updateCustomer('phone', e.target.value)} />
              <TextField label="Delivery area or city (optional)" fullWidth size="small" value={customer.area}
                onChange={(e) => updateCustomer('area', e.target.value)} />
              <TextField label="Note (optional)" fullWidth size="small" multiline minRows={2} value={customer.note}
                onChange={(e) => updateCustomer('note', e.target.value)} placeholder="e.g. window width, fitting needed" />
            </div>

            <Button
              variant="contained"
              size="large"
              fullWidth
              startIcon={<WhatsAppIcon />}
              onClick={placeOrder}
              sx={{ mt: 2.5, textTransform: 'none', fontWeight: 700, bgcolor: '#1a7f45', '&:hover': { bgcolor: '#14663a' } }}
            >
              Place order on WhatsApp
            </Button>
            <p className="mt-2 text-xs text-[#4b5b63]">
              Opens WhatsApp with your order typed out for {CONTACT.phoneDisplay}. Press send to place it.
            </p>
          </div>
          <div className="flex justify-between text-sm">
            <Link to="/products" className="text-[#a8400f] hover:underline">Add more products</Link>
            <button type="button" className="text-[#4b5b63] hover:text-[#b3261e]" onClick={() => { if (window.confirm('Remove everything from the cart?')) dispatch(clearOrderCart()); }}>
              Empty cart
            </button>
          </div>
        </aside>
      </div>

      <Dialog open={sentOpen} onClose={() => setSentOpen(false)}>
        <DialogTitle>Did you send the order on WhatsApp?</DialogTitle>
        <DialogContent>
          <Alert severity="info">
            WhatsApp should have opened with your order. Once you press send there, we reply to confirm prices and delivery.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSentOpen(false)}>Not yet, keep my cart</Button>
          <Button variant="contained" onClick={() => { dispatch(clearOrderCart()); setSentOpen(false); }}>Yes, empty the cart</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
