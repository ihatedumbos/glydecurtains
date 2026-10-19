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
};

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

/** Pre-filled enquiry for a product, including its page link so the team knows exactly which item. */
export function productEnquiryLink(
  product: { id: number; name: string },
  price?: number | null,
  option?: string,
): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const optionText = option ? `, ${option}` : '';
  const priceText = price ? ` (₹${price.toLocaleString('en-IN')})` : '';
  return whatsappLink(`Hi Glyde, I'm interested in ${product.name}${optionText}${priceText}. ${origin}/products/${product.id}`);
}
