import type { OrderCartItem } from '@/store/slices/orderCartSlice';

export interface OrderCustomer {
  name: string;
  phone?: string;
  area?: string;
  note?: string;
}

const rupees = (n: number) => `₹${n.toLocaleString('en-IN')}`;

/** Total of the priced lines, and how many lines still need a price from the shop. */
export function orderTotals(items: OrderCartItem[]): { total: number; unpriced: number; pieces: number } {
  return items.reduce(
    (acc, item) => ({
      total: acc.total + (item.unitPrice > 0 ? item.unitPrice * item.quantity : 0),
      unpriced: acc.unpriced + (item.unitPrice > 0 ? 0 : 1),
      pieces: acc.pieces + item.quantity,
    }),
    { total: 0, unpriced: 0, pieces: 0 },
  );
}

/** The WhatsApp message the shop receives when the customer places the order. */
export function buildOrderSummary(items: OrderCartItem[], customer: OrderCustomer, origin = ''): string {
  const { total, unpriced } = orderTotals(items);
  const lines: string[] = ['Hi Glyde, I would like to place an order:', ''];
  items.forEach((item, index) => {
    const option = [item.size, item.color].filter(Boolean).join(', ');
    lines.push(`${index + 1}. ${item.name}${option ? ` (${option})` : ''}`);
    lines.push(
      item.unitPrice > 0
        ? `   Qty ${item.quantity} × ${rupees(item.unitPrice)} = ${rupees(item.unitPrice * item.quantity)}`
        : `   Qty ${item.quantity}, price on request`,
    );
    if (origin) lines.push(`   ${origin}/products/${item.productId}`);
  });
  lines.push('');
  if (total > 0) lines.push(`Total: ${rupees(total)}${unpriced ? ` + ${unpriced} item${unpriced === 1 ? '' : 's'} price on request` : ''}`);
  else lines.push('Please share the prices.');
  lines.push('');
  lines.push(`Name: ${customer.name.trim()}`);
  if (customer.phone?.trim()) lines.push(`Phone: ${customer.phone.trim()}`);
  if (customer.area?.trim()) lines.push(`Delivery area: ${customer.area.trim()}`);
  if (customer.note?.trim()) lines.push(`Note: ${customer.note.trim()}`);
  return lines.join('\n');
}
