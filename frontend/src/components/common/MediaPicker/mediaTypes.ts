/** Types for the MediaPicker component suite */

export type MediaType = 'image' | 'video';
export type AcceptType = 'image' | 'video' | 'both';

export interface MediaItem {
  id: number;
  base64Data: string;
  mimeType: string;
  originalFilename: string;
  mediaType: MediaType;
  duration?: number; // seconds, for videos
  sortOrder: number;
  isThumbnail?: boolean;
}

export interface UploadedMedia {
  file: File;
  base64Data: string;
  mimeType: string;
  originalFilename: string;
  mediaType: MediaType;
  duration?: number;
  previewUrl: string;
}

export interface MediaPickerProps {
  accept: AcceptType;
  multiple?: boolean;
  maxImageSize?: number; // bytes, default 5MB
  maxVideoSize?: number; // bytes, default 10MB
  maxDuration?: number; // seconds, default 10
  onUpload: (files: UploadedMedia[]) => void;
  existingMedia?: MediaItem[];
  onReorder?: (order: number[]) => void;
  onDelete?: (mediaId: number) => void;
  onReplace?: (mediaId: number, file: UploadedMedia) => void;
  disabled?: boolean;
}

export interface ValidationError {
  file: File;
  message: string;
  constraint: 'format' | 'size' | 'duration';
}

export interface FileWithPreview {
  id: string;
  file: File;
  previewUrl: string;
  mediaType: MediaType;
  duration?: number;
  error?: string;
  isValid: boolean;
}

export interface UploadProgressState {
  fileId: string;
  filename: string;
  progress: number; // 0-100
  status: 'encoding' | 'uploading' | 'complete' | 'error';
}

// Supported MIME types
export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
] as const;

export const SUPPORTED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
] as const;

export const SUPPORTED_IMAGE_EXTENSIONS = '.jpg,.jpeg,.png,.webp,.svg';
export const SUPPORTED_VIDEO_EXTENSIONS = '.mp4,.webm';

export const DEFAULT_MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const DEFAULT_MAX_VIDEO_SIZE = 10 * 1024 * 1024; // 10MB
export const DEFAULT_MAX_DURATION = 10; // 10 seconds
