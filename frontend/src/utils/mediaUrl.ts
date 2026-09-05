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

  const backendUrl = (import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const hasExplicitBackend = Boolean(backendUrl);

  if (normalizedUrl.startsWith('/')) {
    const assetLikePath =
      normalizedUrl.startsWith('/api/') ||
      normalizedUrl.startsWith('/images/') ||
      normalizedUrl.startsWith('/uploads/') ||
      normalizedUrl.startsWith('/static/') ||
      normalizedUrl.startsWith('/products/') ||
      normalizedUrl.startsWith('/assets/') ||
      /\.(png|jpe?g|webp|gif|svg|avif|mp4|mov|webm|m4v)(?:\?.*)?$/i.test(normalizedUrl);

    if (assetLikePath) {
      return `${currentOrigin}${normalizedUrl}`;
    }

    if (hasExplicitBackend) {
      return `${backendUrl}${normalizedUrl}`;
    }

    return `${currentOrigin || ''}${normalizedUrl}`;
  }

  const relativePath = normalizedUrl.startsWith('products/') || normalizedUrl.startsWith('images/') || normalizedUrl.startsWith('static/') || normalizedUrl.startsWith('assets/')
    ? `/${normalizedUrl}`
    : normalizedUrl;

  if (relativePath.startsWith('/')) {
    if (hasExplicitBackend) {
      return `${backendUrl}${relativePath}`;
    }
    return `${currentOrigin || ''}${relativePath}`;
  }

  return relativePath;
}
