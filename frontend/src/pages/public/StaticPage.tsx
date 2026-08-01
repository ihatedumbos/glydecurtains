import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, CircularProgress, Container } from '@mui/material';
import axiosInstance from '@/api/axiosInstance';
import type { StaticPage as StaticPageType } from '@/store/slices/cmsSlice';

export default function StaticPage() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<StaticPageType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    setLoading(true);
    setError(null);

    axiosInstance
      .get(`/cms/pages/slug/${slug}`)
      .then((res) => {
        const data = res.data?.data || res.data;
        setPage(data);
      })
      .catch((err) => {
        if (err.response?.status === 404) {
          setError('Page not found.');
        } else {
          setError('Failed to load page. Please try again later.');
        }
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <Box className="flex items-center justify-center min-h-[50vh]">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !page) {
    return (
      <Container maxWidth="md" className="py-16 text-center">
        <Typography variant="h5" color="error">
          {error || 'Page not found.'}
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" className="py-8">
      <Typography variant="h3" component="h1" className="mb-6 font-bold">
        {page.title}
      </Typography>
      <Box
        className="prose prose-lg max-w-none"
        dangerouslySetInnerHTML={{ __html: page.content }}
      />
    </Container>
  );
}
