export function resolveMediaUrl(url?: string | null): string {
  if (!url) return '';

  const normalizedUrl = url.trim();

  if (
    normalizedUrl.startsWith('data:') ||
    normalizedUrl.startsWith('http://') ||
    normalizedUrl.startsWith('https://') ||
    normalizedUrl.startsWith('blob:') ||
    normalizedUrl.startsWith('blob')
  ) {
    return normalizedUrl;
  }

  const backendUrl = (import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');

  if (normalizedUrl.startsWith('/')) {
    return `${backendUrl}${normalizedUrl}`;
  }

  const relativePath = normalizedUrl.startsWith('products/') || normalizedUrl.startsWith('images/') || normalizedUrl.startsWith('static/') || normalizedUrl.startsWith('assets/')
    ? `/${normalizedUrl}`
    : normalizedUrl;

  if (relativePath.startsWith('/')) {
    return `${backendUrl}${relativePath}`;
  }

  return relativePath;
}
