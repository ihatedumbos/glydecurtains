import { Box, IconButton, Typography, Chip } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import VideocamIcon from '@mui/icons-material/Videocam';
import ImageIcon from '@mui/icons-material/Image';
import type { FileWithPreview } from './mediaTypes';

interface MediaPreviewProps {
  item: FileWithPreview;
  onRemove: (id: string) => void;
  showError?: boolean;
}

export default function MediaPreview({ item, onRemove, showError = true }: MediaPreviewProps) {
  const isVideo = item.mediaType === 'video';

  return (
    <Box
      sx={{
        position: 'relative',
        width: 140,
        borderRadius: 1.5,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: item.error ? 'error.main' : 'divider',
        bgcolor: 'background.paper',
        flexShrink: 0,
      }}
    >
      {/* Preview area */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'action.hover',
          overflow: 'hidden',
        }}
      >
        {item.isValid ? (
          isVideo ? (
            <video
              src={item.previewUrl}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              muted
              playsInline
              preload="metadata"
            />
          ) : (
            <Box
              component="img"
              src={item.previewUrl}
              alt={item.file.name}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          )
        ) : (
          <ErrorOutlineIcon sx={{ fontSize: 32, color: 'error.main' }} />
        )}

        {/* Media type badge */}
        <Chip
          icon={isVideo ? <VideocamIcon /> : <ImageIcon />}
          label={isVideo ? `${item.duration?.toFixed(1) ?? '?'}s` : 'IMG'}
          size="small"
          sx={{
            position: 'absolute',
            top: 4,
            left: 4,
            height: 20,
            fontSize: '0.65rem',
            bgcolor: 'rgba(0,0,0,0.6)',
            color: 'white',
            '& .MuiChip-icon': {
              color: 'white',
              fontSize: 12,
            },
          }}
        />

        {/* Remove button */}
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(item.id);
          }}
          aria-label={`Remove ${item.file.name}`}
          sx={{
            position: 'absolute',
            top: 2,
            right: 2,
            bgcolor: 'rgba(0,0,0,0.6)',
            color: 'white',
            width: 22,
            height: 22,
            '&:hover': {
              bgcolor: 'error.main',
            },
          }}
        >
          <CloseIcon sx={{ fontSize: 14 }} />
        </IconButton>
      </Box>

      {/* File info */}
      <Box sx={{ p: 0.75 }}>
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: '0.65rem',
          }}
          title={item.file.name}
        >
          {item.file.name}
        </Typography>

        {/* Error message */}
        {showError && item.error && (
          <Typography
            variant="caption"
            color="error"
            sx={{
              display: 'block',
              mt: 0.25,
              fontSize: '0.6rem',
              lineHeight: 1.2,
            }}
          >
            {item.error}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
