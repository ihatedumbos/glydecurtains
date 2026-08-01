import { useState, useRef, useCallback, type DragEvent, type ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import {
  type AcceptType,
  SUPPORTED_IMAGE_EXTENSIONS,
  SUPPORTED_VIDEO_EXTENSIONS,
} from './mediaTypes';

interface DropZoneProps {
  accept: AcceptType;
  multiple?: boolean;
  disabled?: boolean;
  onFilesSelected: (files: File[]) => void;
  children?: ReactNode;
}

function getAcceptString(accept: AcceptType): string {
  switch (accept) {
    case 'image':
      return SUPPORTED_IMAGE_EXTENSIONS;
    case 'video':
      return SUPPORTED_VIDEO_EXTENSIONS;
    case 'both':
      return `${SUPPORTED_IMAGE_EXTENSIONS},${SUPPORTED_VIDEO_EXTENSIONS}`;
  }
}

function getAcceptLabel(accept: AcceptType): string {
  switch (accept) {
    case 'image':
      return 'JPEG, PNG, WebP, SVG';
    case 'video':
      return 'MP4, WebM';
    case 'both':
      return 'JPEG, PNG, WebP, SVG, MP4, WebM';
  }
}

export default function DropZone({
  accept,
  multiple = false,
  disabled = false,
  onFilesSelected,
  children,
}: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCountRef = useRef(0);

  const handleDragEnter = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled) return;
      dragCountRef.current += 1;
      if (dragCountRef.current === 1) {
        setIsDragOver(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      dragCountRef.current -= 1;
      if (dragCountRef.current === 0) {
        setIsDragOver(false);
      }
    },
    []
  );

  const handleDragOver = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
    },
    []
  );

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      dragCountRef.current = 0;
      setIsDragOver(false);

      if (disabled) return;

      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length > 0) {
        const filesToProcess = multiple ? droppedFiles : [droppedFiles[0]];
        onFilesSelected(filesToProcess);
      }
    },
    [disabled, multiple, onFilesSelected]
  );

  const handleClick = useCallback(() => {
    if (disabled) return;
    fileInputRef.current?.click();
  }, [disabled]);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        onFilesSelected(Array.from(files));
      }
      // Reset input so the same file can be re-selected
      e.target.value = '';
    },
    [onFilesSelected]
  );

  return (
    <Box
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={`Drop zone for ${getAcceptLabel(accept)} files`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      sx={{
        position: 'relative',
        border: '2px dashed',
        borderColor: isDragOver
          ? 'primary.main'
          : disabled
            ? 'action.disabled'
            : 'divider',
        borderRadius: 2,
        p: 4,
        textAlign: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        bgcolor: isDragOver
          ? 'action.hover'
          : 'background.paper',
        transition: 'all 0.2s ease-in-out',
        opacity: disabled ? 0.5 : 1,
        '&:hover': disabled
          ? {}
          : {
              borderColor: 'primary.light',
              bgcolor: 'action.hover',
            },
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={getAcceptString(accept)}
        multiple={multiple}
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
        aria-hidden="true"
      />

      {children || (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <CloudUploadIcon
            sx={{
              fontSize: 48,
              color: isDragOver ? 'primary.main' : 'text.secondary',
              transition: 'color 0.2s',
            }}
          />
          <Typography variant="body1" color="text.primary">
            {isDragOver
              ? 'Drop files here'
              : 'Drag & drop files here, or click to browse'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Supported formats: {getAcceptLabel(accept)}
          </Typography>
          {multiple && (
            <Typography variant="caption" color="text.secondary">
              Multiple files supported
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}
