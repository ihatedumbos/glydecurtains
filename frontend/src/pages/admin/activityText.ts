/** Plain-language wording for activity log entries, shared by the overview and activity pages. */

export interface ActivityEntry {
  actionType: string;
  entityType?: string | null;
  details?: string | null;
}

const ACTIONS: Record<string, string> = {
  PRODUCT_CREATED: 'added',
  PRODUCT_UPDATED: 'edited',
  PRODUCT_PRICES_UPDATED: 'changed the sizes, colours or prices of',
  PRODUCT_SPECS_UPDATED: 'changed the details of',
  PRODUCT_HIDDEN: 'hid',
  PRODUCT_SHOWN: 'put back on the website',
  PRODUCT_DELETED: 'deleted',
  USER_LOGIN: 'signed in',
  USER_LOGOUT: 'signed out',
  USER_REGISTERED: 'registered an account',
  PASSWORD_CHANGE: 'changed their password',
  PASSWORD_RESET: 'reset their password',
  ORDER_PLACED: 'placed an order',
  ORDER_STATUS_UPDATED: 'updated an order',
  ORDER_CANCELLED: 'cancelled an order',
};

function parseDetails(details?: string | null): Record<string, unknown> {
  if (!details) return {};
  try {
    const parsed = JSON.parse(details);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function describeActivity(entry: ActivityEntry): string {
  const verb = ACTIONS[entry.actionType] ?? entry.actionType.toLowerCase().replace(/_/g, ' ');
  const name = parseDetails(entry.details).name;
  if (entry.entityType === 'PRODUCT') {
    return `${verb} ${typeof name === 'string' && name ? `“${name}”` : 'a product'}`;
  }
  return verb;
}

/** Server times are UTC without a zone marker. */
export function parseServerTime(value: string): Date {
  return new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(value) ? value : `${value}Z`);
}

export function timeAgo(value: string): string {
  const date = parseServerTime(value);
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}
