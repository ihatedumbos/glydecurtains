/**
 * Client-side validation utilities for media file uploads.
 * Validates format, size, and video duration before upload.
 */

import {
  SUPPORTED_IMAGE_TYPES,
  SUPPORTED_VIDEO_TYPES,
  DEFAULT_MAX_IMAGE_SIZE,
  DEFAULT_MAX_VIDEO_SIZE,
  DEFAULT_MAX_DURATION,
  type MediaType,
  type ValidationError,
} from './mediaTypes';

/**
 * Determine the media type from a file's MIME type.
 * Returns null if the format is unsupported.
 */
export function getMediaType(file: File): MediaType | null {
  if ((SUPPORTED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return 'image';
  }
  if ((SUPPORTED_VIDEO_TYPES as readonly string[]).includes(file.type)) {
    return 'video';
  }
  return null;
}

/**
 * Validate a file's MIME type against supported formats.
 */
export function validateFormat(
  file: File,
  accept: 'image' | 'video' | 'both'
): ValidationError | null {
  const mediaType = getMediaType(file);

  if (!mediaType) {
    return {
      file,
      message: `Unsupported file format "${file.type || 'unknown'}". Supported formats: JPEG, PNG, WebP, SVG (images), MP4, WebM (videos).`,
      constraint: 'format',
    };
  }

  if (accept === 'image' && mediaType !== 'image') {
    return {
      file,
      message: `Only image files are accepted. "${file.name}" is a video file.`,
      constraint: 'format',
    };
  }

  if (accept === 'video' && mediaType !== 'video') {
    return {
      file,
      message: `Only video files are accepted. "${file.name}" is an image file.`,
      constraint: 'format',
    };
  }

  return null;
}

/**
 * Validate file size based on its media type.
 */
export function validateSize(
  file: File,
  maxImageSize: number = DEFAULT_MAX_IMAGE_SIZE,
  maxVideoSize: number = DEFAULT_MAX_VIDEO_SIZE
): ValidationError | null {
  const mediaType = getMediaType(file);

  if (mediaType === 'image' && file.size > maxImageSize) {
    const maxMB = (maxImageSize / (1024 * 1024)).toFixed(0);
    const fileMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      file,
      message: `Image "${file.name}" is too large (${fileMB}MB). Maximum size is ${maxMB}MB.`,
      constraint: 'size',
    };
  }

  if (mediaType === 'video' && file.size > maxVideoSize) {
    const maxMB = (maxVideoSize / (1024 * 1024)).toFixed(0);
    const fileMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      file,
      message: `Video "${file.name}" is too large (${fileMB}MB). Maximum size is ${maxMB}MB.`,
      constraint: 'size',
    };
  }

  return null;
}

/**
 * Validate video duration by loading it into an HTMLVideoElement.
 * Returns a promise that resolves to a ValidationError or null.
 */
export function validateVideoDuration(
  file: File,
  maxSeconds: number = DEFAULT_MAX_DURATION
): Promise<ValidationError | null> {
  return new Promise((resolve) => {
    const mediaType = getMediaType(file);
    if (mediaType !== 'video') {
      resolve(null);
      return;
    }

    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      const duration = video.duration;
      URL.revokeObjectURL(video.src);

      if (duration > maxSeconds) {
        resolve({
          file,
          message: `Video "${file.name}" is ${duration.toFixed(1)} seconds long. Maximum duration is ${maxSeconds} seconds.`,
          constraint: 'duration',
        });
      } else {
        resolve(null);
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      resolve({
        file,
        message: `Unable to read video metadata for "${file.name}". The file may be corrupted.`,
        constraint: 'format',
      });
    };

    video.src = URL.createObjectURL(file);
  });
}

/**
 * Get the duration of a video file in seconds.
 */
export function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';

    video.onloadedmetadata = () => {
      const duration = video.duration;
      URL.revokeObjectURL(video.src);
      resolve(duration);
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error(`Unable to read video duration for "${file.name}"`));
    };

    video.src = URL.createObjectURL(file);
  });
}

/**
 * Run all validations on a file. Returns the first error found, or null if valid.
 */
export async function validateFile(
  file: File,
  options: {
    accept: 'image' | 'video' | 'both';
    maxImageSize?: number;
    maxVideoSize?: number;
    maxDuration?: number;
  }
): Promise<ValidationError | null> {
  // 1. Check format
  const formatError = validateFormat(file, options.accept);
  if (formatError) return formatError;

  // 2. Check size
  const sizeError = validateSize(
    file,
    options.maxImageSize,
    options.maxVideoSize
  );
  if (sizeError) return sizeError;

  // 3. Check video duration
  const durationError = await validateVideoDuration(
    file,
    options.maxDuration
  );
  if (durationError) return durationError;

  return null;
}

/**
 * Convert a file to a Base64 data string.
 * Reports progress via optional callback.
 */
export function fileToBase64(
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress(progress);
      }
    };

    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data:...;base64, prefix to get raw Base64
      const base64 = result.split(',')[1];
      resolve(base64);
    };

    reader.onerror = () => {
      reject(new Error(`Failed to read file "${file.name}"`));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Utility: format bytes into a human-readable string.
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}
