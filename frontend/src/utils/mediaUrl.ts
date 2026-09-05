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
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';

  if (normalizedUrl.startsWith('/')) {
    const assetLikePath =
      normalizedUrl.startsWith('/api/') ||
      normalizedUrl.startsWith('/images/') ||
      normalizedUrl.startsWith('/uploads/') ||
      normalizedUrl.startsWith('/static/') ||
      normalizedUrl.startsWith('/products/') ||
      normalizedUrl.startsWith('/assets/');

    if (assetLikePath) {
      return `${currentOrigin}${normalizedUrl}`;
    }

    if (backendUrl.startsWith('http://') || backendUrl.startsWith('https://')) {
      return `${backendUrl}${normalizedUrl}`;
    }

    return `${currentOrigin || ''}${normalizedUrl}`;
  }

  const relativePath = normalizedUrl.startsWith('products/') || normalizedUrl.startsWith('images/') || normalizedUrl.startsWith('static/') || normalizedUrl.startsWith('assets/')
    ? `/${normalizedUrl}`
    : normalizedUrl;

  if (relativePath.startsWith('/')) {
    if (backendUrl.startsWith('http://') || backendUrl.startsWith('https://')) {
      return `${backendUrl}${relativePath}`;
    }
    return `${currentOrigin || ''}${relativePath}`;
  }

  return relativePath;
}
