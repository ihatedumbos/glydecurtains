import { Box, LinearProgress, Typography, Stack } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import type { UploadProgressState } from './mediaTypes';

interface UploadProgressProps {
  items: UploadProgressState[];
}

function getStatusColor(status: UploadProgressState['status']): string {
  switch (status) {
    case 'complete':
      return 'success.main';
    case 'error':
      return 'error.main';
    default:
      return 'primary.main';
  }
}

function getStatusLabel(status: UploadProgressState['status']): string {
  switch (status) {
    case 'encoding':
      return 'Encoding...';
    case 'uploading':
      return 'Uploading...';
    case 'complete':
      return 'Done';
    case 'error':
      return 'Failed';
  }
}

export default function UploadProgress({ items }: UploadProgressProps) {
  if (items.length === 0) return null;

  return (
    <Stack spacing={1} sx={{ mt: 2 }}>
      {items.map((item) => (
        <Box
          key={item.fileId}
          sx={{
            p: 1.5,
            borderRadius: 1,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 0.5,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '70%',
              }}
              title={item.filename}
            >
              {item.filename}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {item.status === 'complete' && (
                <CheckCircleIcon sx={{ fontSize: 14, color: 'success.main' }} />
              )}
              {item.status === 'error' && (
                <ErrorIcon sx={{ fontSize: 14, color: 'error.main' }} />
              )}
              <Typography
                variant="caption"
                sx={{ color: getStatusColor(item.status), fontSize: '0.65rem' }}
              >
                {getStatusLabel(item.status)}
              </Typography>
            </Box>
          </Box>

          <LinearProgress
            variant="determinate"
            value={item.progress}
            color={
              item.status === 'error'
                ? 'error'
                : item.status === 'complete'
                  ? 'success'
                  : 'primary'
            }
            sx={{ height: 4, borderRadius: 2 }}
          />
        </Box>
      ))}
    </Stack>
  );
}
