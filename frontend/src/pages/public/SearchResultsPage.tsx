import { Navigate, useLocation } from 'react-router-dom';

// Search results live on the product listing (search + filters + sort in one place).
// Keep /search?q=... working for old links and bookmarks.
export default function SearchResultsPage() {
  const { search } = useLocation();
  return <Navigate to={`/products${search}`} replace />;
}
