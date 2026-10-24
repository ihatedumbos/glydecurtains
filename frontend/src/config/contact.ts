import { useAppSelector } from '@/store/hooks';
import type { SiteSettings } from '@/store/slices/cmsSlice';

/**
 * Business contact details shown across the storefront. The site is a catalogue only:
 * visitors enquire and order over WhatsApp, so every call to action points here.
 * These are the defaults; the phone, email and address saved under Business details in the
 * admin panel replace them once the site settings load (see applySiteSettings).
 */
export const CONTACT = {
  whatsappNumber: '918149066661',
  phoneDisplay: '+91 81490 66661',
  email: 'vishalsjain89@gmail.com',
  businessName: 'Glyde Curtain Track & Accessories',
  address: 'Shree Vinayak Furnishing, 916 Sukrawar Peth, Panghanti Chowk, near Radhe Hotel, Pune 411042, Maharashtra',
  addressShort: 'Sukrawar Peth, Pune, Maharashtra',
  /**
   * Google Business Profile (business.google.com). Paste the profile's "Share" link and its
   * "Ask for reviews" link here, or under Business details in the admin panel. Empty hides them.
   */
  googleProfileUrl: '',
  googleReviewUrl: '',
};

/** Link to the shop on Google Maps: the Business Profile once it exists, else a search for the address. */
export function googleMapsLink(): string {
  return CONTACT.googleProfileUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CONTACT.address)}`;
}

/** Copies the admin's Business details over the defaults. Call before storing the settings. */
export function applySiteSettings(settings: Partial<SiteSettings> | null | undefined): void {
  if (!settings) return;
  const digits = (settings.contactPhone || '').replace(/\D/g, '');
  if (digits.length >= 10) {
    CONTACT.whatsappNumber = digits.length === 10 ? `91${digits}` : digits;
    CONTACT.phoneDisplay = settings.contactPhone!.trim();
  }
  if (settings.contactEmail?.includes('@')) CONTACT.email = settings.contactEmail.trim();
  if (settings.address?.trim()) CONTACT.address = settings.address.trim();
  const links = parseSocialLinks(settings.socialLinks);
  if (isHttpUrl(links.googleProfile)) CONTACT.googleProfileUrl = links.googleProfile.trim();
  if (isHttpUrl(links.googleReview)) CONTACT.googleReviewUrl = links.googleReview.trim();
}

/** The backend stores social links as a JSON string; older data may already be an object. */
function parseSocialLinks(raw: unknown): Record<string, string> {
  if (raw && typeof raw === 'object') return raw as Record<string, string>;
  if (typeof raw !== 'string' || !raw.trim()) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function isHttpUrl(value: string | undefined): value is string {
  return !!value && /^https:\/\//.test(value.trim());
}

/** Re-renders the caller when the site settings arrive, and returns the current details. */
export function useContact(): typeof CONTACT {
  useAppSelector((state) => state.cms.settings);
  return CONTACT;
}

/** wa.me link that opens a WhatsApp chat with the business, optionally with a pre-filled message. */
export function whatsappLink(message?: string): string {
  const base = `https://wa.me/${CONTACT.whatsappNumber}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export interface EnquiryDetails {
  price?: number | null;
  size?: string | null;
  color?: string | null;
  quantity?: number;
}

/**
 * Pre-filled enquiry for a product: one detail per line (name, code, size, colour, quantity,
 * price) and its page link, so the shop sees exactly what the customer picked.
 */
export function productEnquiryMessage(
  product: { id: number; name: string; sku?: string | null },
  details: EnquiryDetails = {},
): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const { price, size, color, quantity } = details;
  const lines = ['Hi Glyde, I am interested in this product:', `Product: ${product.name}`];
  if (product.sku?.trim()) lines.push(`Code: ${product.sku.trim()}`);
  if (size) lines.push(`Size: ${size}`);
  if (color) lines.push(`Colour: ${color}`);
  if (quantity && quantity > 0) lines.push(`Quantity: ${quantity}`);
  lines.push(price ? `Price shown: ₹${price.toLocaleString('en-IN')}${quantity && quantity > 1 ? ' each' : ''}` : 'Price: please share');
  lines.push(`${origin}/products/${product.id}`);
  return lines.join('\n');
}

/** WhatsApp link carrying the product enquiry above. */
export function productEnquiryLink(
  product: { id: number; name: string; sku?: string | null },
  details: EnquiryDetails = {},
): string {
  return whatsappLink(productEnquiryMessage(product, details));
}
