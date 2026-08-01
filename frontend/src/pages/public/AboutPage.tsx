import { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Container } from '@mui/material';
import axiosInstance from '@/api/axiosInstance';
import type { StaticPage } from '@/store/slices/cmsSlice';

export default function AboutPage() {
  const [page, setPage] = useState<StaticPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    axiosInstance
      .get('/cms/pages/slug/about-us')
      .then((res) => {
        const data = res.data?.data || res.data;
        setPage(data);
      })
      .catch(() => {
        setError('Failed to load page content.');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box className="flex items-center justify-center min-h-[50vh]">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !page) {
    return (
      <Container maxWidth="md" className="py-16">
        <Typography variant="h3" component="h1" className="mb-6 font-bold">
          About Us
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {error || 'Content is being prepared. Please check back soon.'}
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
