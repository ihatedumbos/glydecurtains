import { useEffect } from 'react';

const SITE_NAME = 'Glyde Curtains';
const DEFAULT_DESCRIPTION =
  'Manufacturer-direct curtain tracks, runners, ceiling and wall fittings, end caps and curtain tapes, made in Pune. Browse sizes and prices, then order on WhatsApp +91 81490 66661.';

/**
 * Sets the browser tab title and the search description for the current page.
 * Google reads these after the page renders; pass nothing while data is still loading.
 */
export function usePageMeta(title?: string | null, description?: string | null): void {
  useEffect(() => {
    if (title === undefined) return;
    document.title = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} | Curtain Tracks & Accessories, Pune`;
    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    const text = (description || DEFAULT_DESCRIPTION).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    meta.content = text.length > 160 ? `${text.slice(0, 157).trimEnd()}...` : text;
  }, [title, description]);
}
