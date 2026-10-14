/**
 * Business contact details shown across the storefront. The site is a catalogue only:
 * visitors enquire and order over WhatsApp, so every call to action points here.
 */
export const CONTACT = {
  whatsappNumber: '918149066661',
  phoneDisplay: '+91 81490 66661',
  email: 'vishalsjain89@gmail.com',
  businessName: 'Glyde Curtain Track & Accessories',
  address: 'Shree Vinayak Furnishing, 916 Sukrawar Peth, Panghanti Chowk, near Radhe Hotel, Pune 411042, Maharashtra',
  addressShort: 'Sukrawar Peth, Pune, Maharashtra',
} as const;

/** wa.me link that opens a WhatsApp chat with the business, optionally with a pre-filled message. */
export function whatsappLink(message?: string): string {
  const base = `https://wa.me/${CONTACT.whatsappNumber}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/** Pre-filled enquiry for a product, including its page link so the team knows exactly which item. */
export function productEnquiryLink(product: { id: number; name: string }, price?: number | null): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const priceText = price ? ` (₹${price.toLocaleString('en-IN')})` : '';
  return whatsappLink(`Hi Glyde, I'm interested in ${product.name}${priceText}. ${origin}/products/${product.id}`);
}
