/**
 * Visitor analytics with Google Analytics 4. Nothing loads until VITE_GA_MEASUREMENT_ID is set
 * (a "G-XXXXXXXXXX" id from analytics.google.com), so local runs and previews send no data.
 *
 * GA4 counts page views by itself, including moves between pages of this single-page app.
 * On top of that we send:
 *  - whatsapp_click: any click that opens a WhatsApp chat, with the product when there is one
 *  - phone_click: a tap on a "call" link
 */

type Params = Record<string, string | number | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const MEASUREMENT_ID = (import.meta.env.VITE_GA_MEASUREMENT_ID || '').trim();

export function trackEvent(name: string, params: Params = {}): void {
  window.gtag?.('event', name, params);
}

/** What a WhatsApp link is about, read from its pre-filled message. */
export function describeWhatsAppLink(href: string): Params {
  let message = '';
  try {
    message = new URL(href).searchParams.get('text') || '';
  } catch {
    return {};
  }
  const product = message.match(/^Product: (.+)$/m)?.[1];
  const code = message.match(/^Code: (.+)$/m)?.[1];
  if (product) return { enquiry_type: 'product', product_name: product, product_code: code };
  if (message.includes('place an order')) return { enquiry_type: 'cart_order' };
  if (message.includes('quote') || message.includes('I need:')) return { enquiry_type: 'quote' };
  return { enquiry_type: message ? 'general' : 'chat' };
}

/** Records a WhatsApp chat being opened. Links are picked up by the click listener; call this for window.open. */
export function trackWhatsApp(href: string, source?: string): void {
  trackEvent('whatsapp_click', { ...describeWhatsAppLink(href), source, page_path: window.location.pathname });
}

function isWhatsAppHref(href: string): boolean {
  return /^https:\/\/(wa\.me|api\.whatsapp\.com)\//.test(href);
}

/** Loads GA4 and starts listening for WhatsApp and phone clicks. Call once at startup. */
export function initAnalytics(): void {
  if (!MEASUREMENT_ID || window.gtag) return;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(MEASUREMENT_ID)}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // gtag.js reads the arguments object itself, so push it as is.
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', MEASUREMENT_ID);

  // One listener for every link on the site, so each WhatsApp button is counted without its own code.
  document.addEventListener(
    'click',
    (event) => {
      const link = (event.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!link) return;
      const href = link.href;
      if (isWhatsAppHref(href)) {
        trackWhatsApp(href, link.textContent?.trim().slice(0, 60));
      } else if (href.startsWith('tel:')) {
        trackEvent('phone_click', { page_path: window.location.pathname });
      }
    },
    true,
  );
}
