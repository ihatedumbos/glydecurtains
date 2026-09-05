export function resolveMediaUrl(url?: string | null): string {
  if (!url) return '';

  if (
    url.startsWith('data:') ||
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('blob:') ||
    url.startsWith('blob')
  ) {
    return url;
  }

  if (url.startsWith('/')) {
    const backendUrl = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080').replace(/\/$/, '');
    return `${backendUrl}${url}`;
  }

  return url;
}
