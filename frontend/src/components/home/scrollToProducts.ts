import type { MouseEvent } from 'react';

/** Smooth-scrolls to the product grid; if it isn't on the page, the link's own `#products` takes over. */
export function scrollToProducts(e: MouseEvent<HTMLElement>): void {
  const target = document.getElementById('products');
  if (!target) return;
  e.preventDefault();
  target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
