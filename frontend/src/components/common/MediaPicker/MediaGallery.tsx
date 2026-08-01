import { useState, useCallback } from 'react';
import {
  Box,
  IconButton,
  Typography,
  Tooltip,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import VideocamIcon from '@mui/icons-material/Videocam';
import StarIcon from '@mui/icons-material/Star';
import type { MediaItem } from './mediaTypes';

interface MediaGalleryProps {
  items: MediaItem[];
  onReorder?: (order: number[]) => void;
  onDelete?: (mediaId: number) => void;
  onReplace?: (mediaId: number) => void;
}

export default function MediaGallery({
  items,
  onReorder,
  onDelete,
  onReplace,
}: MediaGalleryProps) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = useCallback(
    (index: number) => {
      if (!onReorder) return;
      setDraggedIndex(index);
    },
    [onReorder]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      if (!onReorder || draggedIndex === null) return;
      setDragOverIndex(index);
    },
    [onReorder, draggedIndex]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault();
      if (!onReorder || draggedIndex === null || draggedIndex === dropIndex) {
        setDraggedIndex(null);
        setDragOverIndex(null);
        return;
      }

      const reordered = [...items];
      const [moved] = reordered.splice(draggedIndex, 1);
      reordered.splice(dropIndex, 0, moved);

      onReorder(reordered.map((item) => item.id));
      setDraggedIndex(null);
      setDragOverIndex(null);
    },
    [onReorder, draggedIndex, items]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (deleteConfirmId !== null && onDelete) {
      onDelete(deleteConfirmId);
    }
    setDeleteConfirmId(null);
  }, [deleteConfirmId, onDelete]);

  if (items.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
        No media uploaded yet.
      </Typography>
    );
  }

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1.5,
          mt: 1,
        }}
      >
        {items.map((item, index) => {
          const isVideo = item.mediaType === 'video';
          const isDragging = draggedIndex === index;
          const isDragOver = dragOverIndex === index;

          return (
            <Box
              key={item.id}
              draggable={!!onReorder}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              sx={{
                position: 'relative',
                width: 130,
                borderRadius: 1.5,
                overflow: 'hidden',
                border: '2px solid',
                borderColor: isDragOver
                  ? 'primary.main'
                  : isDragging
                    ? 'primary.light'
                    : 'divider',
                opacity: isDragging ? 0.5 : 1,
                transition: 'all 0.15s ease',
                bgcolor: 'background.paper',
                cursor: onReorder ? 'grab' : 'default',
                '&:hover .gallery-actions': {
                  opacity: 1,
                },
              }}
            >
              {/* Image/video preview */}
              <Box
                sx={{
                  width: '100%',
                  height: 90,
                  position: 'relative',
                  overflow: 'hidden',
                  bgcolor: 'action.hover',
                }}
              >
                {isVideo ? (
                  <video
                    src={`data:${item.mimeType};base64,${item.base64Data}`}
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
                    src={`data:${item.mimeType};base64,${item.base64Data}`}
                    alt={item.originalFilename}
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                )}

                {/* Media type badge */}
                {isVideo && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 4,
                      left: 4,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.25,
                      bgcolor: 'rgba(0,0,0,0.65)',
                      color: 'white',
                      borderRadius: 0.5,
                      px: 0.5,
                      py: 0.15,
                    }}
                  >
                    <VideocamIcon sx={{ fontSize: 11 }} />
                    <Typography sx={{ fontSize: '0.6rem' }}>
                      {item.duration ? `${item.duration}s` : 'Video'}
                    </Typography>
                  </Box>
                )}

                {/* Thumbnail badge */}
                {item.isThumbnail && (
                  <Tooltip title="Thumbnail">
                    <StarIcon
                      sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        fontSize: 16,
                        color: 'warning.main',
                        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))',
                      }}
                    />
                  </Tooltip>
                )}

                {/* Drag handle */}
                {onReorder && (
                  <DragIndicatorIcon
                    sx={{
                      position: 'absolute',
                      bottom: 4,
                      left: 4,
                      fontSize: 16,
                      color: 'rgba(255,255,255,0.8)',
                      filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))',
                    }}
                  />
                )}

                {/* Hover actions overlay */}
                <Box
                  className="gallery-actions"
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 0.5,
                    bgcolor: 'rgba(0,0,0,0.5)',
                    opacity: 0,
                    transition: 'opacity 0.15s ease',
                  }}
                >
                  {onReplace && (
                    <Tooltip title="Replace">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onReplace(item.id);
                        }}
                        sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.15)' }}
                        aria-label={`Replace ${item.originalFilename}`}
                      >
                        <SwapHorizIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                  {onDelete && (
                    <Tooltip title="Delete">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(item.id);
                        }}
                        sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.15)' }}
                        aria-label={`Delete ${item.originalFilename}`}
                      >
                        <DeleteIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>

              {/* Filename */}
              <Box sx={{ px: 0.75, py: 0.5 }}>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontSize: '0.6rem',
                  }}
                  title={item.originalFilename}
                >
                  {item.originalFilename}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        maxWidth="xs"
      >
        <DialogContent>
          <Typography>
            Are you sure you want to delete this media? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
