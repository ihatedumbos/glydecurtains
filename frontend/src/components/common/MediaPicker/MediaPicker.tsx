import { useState, useCallback } from 'react';
import { Box, Typography, Alert, Button, Stack } from '@mui/material';
import UploadIcon from '@mui/icons-material/Upload';
import DropZone from './DropZone';
import MediaPreview from './MediaPreview';
import MediaGallery from './MediaGallery';
import UploadProgress from './UploadProgress';
import { validateFile, fileToBase64, getMediaType, getVideoDuration } from './mediaValidation';
import type {
  MediaPickerProps,
  FileWithPreview,
  UploadedMedia,
  UploadProgressState,
} from './mediaTypes';
import {
  DEFAULT_MAX_IMAGE_SIZE,
  DEFAULT_MAX_VIDEO_SIZE,
  DEFAULT_MAX_DURATION,
} from './mediaTypes';

let fileIdCounter = 0;
function generateFileId(): string {
  fileIdCounter += 1;
  return `file-${Date.now()}-${fileIdCounter}`;
}

export default function MediaPicker({
  accept,
  multiple = false,
  maxImageSize = DEFAULT_MAX_IMAGE_SIZE,
  maxVideoSize = DEFAULT_MAX_VIDEO_SIZE,
  maxDuration = DEFAULT_MAX_DURATION,
  onUpload,
  existingMedia = [],
  onReorder,
  onDelete,
  onReplace,
  disabled = false,
}: MediaPickerProps) {
  const [pendingFiles, setPendingFiles] = useState<FileWithPreview[]>([]);
  const [uploadProgress, setUploadProgress] = useState<UploadProgressState[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const handleFilesSelected = useCallback(
    async (files: File[]) => {
      setGlobalError(null);

      const processed: FileWithPreview[] = await Promise.all(
        files.map(async (file) => {
          const id = generateFileId();
          const mediaType = getMediaType(file);
          const previewUrl = URL.createObjectURL(file);

          // Validate
          const validationError = await validateFile(file, {
            accept,
            maxImageSize,
            maxVideoSize,
            maxDuration,
          });

          // Get video duration if valid video
          let duration: number | undefined;
          if (mediaType === 'video' && !validationError) {
            try {
              duration = await getVideoDuration(file);
            } catch {
              // Duration check failed - already handled by validation
            }
          }

          return {
            id,
            file,
            previewUrl,
            mediaType: mediaType ?? 'image',
            duration,
            error: validationError?.message,
            isValid: !validationError,
          };
        })
      );

      if (multiple) {
        setPendingFiles((prev) => [...prev, ...processed]);
      } else {
        // Clean up previous preview URLs
        pendingFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));
        setPendingFiles(processed.slice(0, 1));
      }
    },
    [accept, maxImageSize, maxVideoSize, maxDuration, multiple, pendingFiles]
  );

  const handleRemovePending = useCallback((id: string) => {
    setPendingFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.previewUrl);
      }
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const handleUploadConfirm = useCallback(async () => {
    const validFiles = pendingFiles.filter((f) => f.isValid);

    if (validFiles.length === 0) {
      setGlobalError('No valid files to upload. Please fix the errors or add new files.');
      return;
    }

    setIsUploading(true);
    setGlobalError(null);

    // Initialize progress state
    const initialProgress: UploadProgressState[] = validFiles.map((f) => ({
      fileId: f.id,
      filename: f.file.name,
      progress: 0,
      status: 'encoding',
    }));
    setUploadProgress(initialProgress);

    const results: UploadedMedia[] = [];

    for (const fileItem of validFiles) {
      try {
        // Encoding phase
        setUploadProgress((prev) =>
          prev.map((p) =>
            p.fileId === fileItem.id ? { ...p, status: 'encoding', progress: 0 } : p
          )
        );

        const base64Data = await fileToBase64(fileItem.file, (progress) => {
          setUploadProgress((prev) =>
            prev.map((p) =>
              p.fileId === fileItem.id
                ? { ...p, progress: Math.round(progress * 0.8) }
                : p
            )
          );
        });

        // Mark as uploading (simulated progress for the server submission portion)
        setUploadProgress((prev) =>
          prev.map((p) =>
            p.fileId === fileItem.id ? { ...p, status: 'uploading', progress: 85 } : p
          )
        );

        results.push({
          file: fileItem.file,
          base64Data,
          mimeType: fileItem.file.type,
          originalFilename: fileItem.file.name,
          mediaType: fileItem.mediaType,
          duration: fileItem.duration,
          previewUrl: fileItem.previewUrl,
        });

        // Mark complete
        setUploadProgress((prev) =>
          prev.map((p) =>
            p.fileId === fileItem.id ? { ...p, status: 'complete', progress: 100 } : p
          )
        );
      } catch {
        setUploadProgress((prev) =>
          prev.map((p) =>
            p.fileId === fileItem.id ? { ...p, status: 'error', progress: 0 } : p
          )
        );
      }
    }

    // Call the onUpload callback with all successfully encoded files
    if (results.length > 0) {
      onUpload(results);
    }

    // Clean up
    setPendingFiles([]);
    setIsUploading(false);

    // Clear progress after a delay
    setTimeout(() => {
      setUploadProgress([]);
    }, 2000);
  }, [pendingFiles, onUpload]);

  const handleCancelAll = useCallback(() => {
    pendingFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));
    setPendingFiles([]);
    setGlobalError(null);
  }, [pendingFiles]);

  const validCount = pendingFiles.filter((f) => f.isValid).length;
  const invalidCount = pendingFiles.filter((f) => !f.isValid).length;

  return (
    <Box>
      {/* Existing media gallery */}
      {existingMedia.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Uploaded Media
          </Typography>
          <MediaGallery
            items={existingMedia}
            onReorder={onReorder}
            onDelete={onDelete}
            onReplace={onReplace}
          />
        </Box>
      )}

      {/* Drop zone */}
      <DropZone
        accept={accept}
        multiple={multiple}
        disabled={disabled || isUploading}
        onFilesSelected={handleFilesSelected}
      />

      {/* Global error */}
      {globalError && (
        <Alert severity="error" sx={{ mt: 1 }} onClose={() => setGlobalError(null)}>
          {globalError}
        </Alert>
      )}

      {/* Pending files preview */}
      {pendingFiles.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 1,
            }}
          >
            <Typography variant="subtitle2">
              Selected Files ({validCount} valid
              {invalidCount > 0 && `, ${invalidCount} with errors`})
            </Typography>
          </Box>

          {/* Previews grid */}
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1.5,
            }}
          >
            {pendingFiles.map((item) => (
              <MediaPreview
                key={item.id}
                item={item}
                onRemove={handleRemovePending}
              />
            ))}
          </Box>

          {/* Action buttons */}
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<UploadIcon />}
              onClick={handleUploadConfirm}
              disabled={validCount === 0 || isUploading}
            >
              {isUploading ? 'Uploading...' : `Upload ${validCount} file${validCount !== 1 ? 's' : ''}`}
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={handleCancelAll}
              disabled={isUploading}
            >
              Cancel
            </Button>
          </Stack>
        </Box>
      )}

      {/* Upload progress */}
      <UploadProgress items={uploadProgress} />
    </Box>
  );
}
