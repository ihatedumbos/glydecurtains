package com.glydecurtains.service;

import com.glydecurtains.dto.response.ImageDataResponse;
import com.glydecurtains.dto.response.ImageResponse;
import org.springframework.web.multipart.MultipartFile;

public interface ImageService {

    /**
     * Uploads and processes an image file.
     * Validates format (JPEG, PNG, WebP, SVG), size (max 5MB raw).
     * Raster images are compressed to max 500KB with min 100x100px validation.
     * SVG images are stored as-is without compression.
     *
     * @param file       the uploaded image file
     * @param entityType the entity type this image belongs to (e.g., "product", "category", "banner")
     * @param entityId   the entity ID this image is associated with
     * @return metadata about the uploaded image
     */
    ImageResponse uploadImage(MultipartFile file, String entityType, Long entityId);

    /**
     * Uploads and processes a video file.
     * Validates format (MP4, WebM), size (max 10MB), duration (max 10 seconds).
     * Video is Base64-encoded and stored with mediaType=VIDEO.
     *
     * @param file       the uploaded video file
     * @param entityType the entity type this video belongs to
     * @param entityId   the entity ID this video is associated with
     * @return metadata about the uploaded video
     */
    ImageResponse uploadVideo(MultipartFile file, String entityType, Long entityId);

    /**
     * Retrieves image/video data by ID including the Base64 content.
     *
     * @param imageId the image/video ID
     * @return the full image data including Base64 content
     */
    ImageDataResponse getImage(Long imageId);

    /**
     * Deletes an image/video by ID.
     *
     * @param imageId the image/video ID to delete
     */
    void deleteImage(Long imageId);
}
