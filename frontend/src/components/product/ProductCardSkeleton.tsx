import { Card, CardContent, Skeleton, Box } from '@mui/material';

export default function ProductCardSkeleton() {
  return (
    <Card sx={{ height: '100%', borderRadius: 2 }}>
      <Skeleton variant="rectangular" height={220} animation="wave" />
      <CardContent>
        <Skeleton variant="text" width="80%" animation="wave" />
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <Skeleton variant="text" width="40%" animation="wave" />
          <Skeleton variant="text" width="30%" animation="wave" />
        </Box>
      </CardContent>
    </Card>
  );
}
