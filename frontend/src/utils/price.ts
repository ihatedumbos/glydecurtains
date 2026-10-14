/** Shows a rupee price, or "Price on request" for items listed without one (price 0). */
/** Leading number of a size label, for ordering sizes smallest first ("4 ft" before "10 ft"). */
export function sizeNumber(size: string): number {
  const match = size.match(/\d+(?:\.\d+)?/);
  return match ? parseFloat(match[0]) : Number.MAX_VALUE;
}

export function formatPrice(price?: number | null): string {
  return price && price > 0 ? `₹${price.toLocaleString('en-IN')}` : 'Price on request';
}
