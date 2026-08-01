package com.glydecurtains.service.impl;

import com.glydecurtains.dto.response.ImageDataResponse;
import com.glydecurtains.dto.response.ImageResponse;
import com.glydecurtains.entity.ProductImage;
import com.glydecurtains.entity.enums.MediaType;
import com.glydecurtains.exception.BusinessException;
import com.glydecurtains.repository.ProductImageRepository;
import com.glydecurtains.service.ImageService;
import com.glydecurtains.util.ImageCompressor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Base64;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class ImageServiceImpl implements ImageService {

    private static final long MAX_IMAGE_SIZE_BYTES = 5L * 1024 * 1024; // 5MB
    private static final long MAX_VIDEO_SIZE_BYTES = 10L * 1024 * 1024; // 10MB
    private static final int MAX_VIDEO_DURATION_SECONDS = 10;

    private static final Set<String> ACCEPTED_IMAGE_FORMATS = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/svg+xml"
    );
    private static final Set<String> ACCEPTED_VIDEO_FORMATS = Set.of(
            "video/mp4", "video/webm"
    );
    private static final Set<String> RASTER_IMAGE_FORMATS = Set.of(
            "image/jpeg", "image/png", "image/webp"
    );

    private final ProductImageRepository productImageRepository;
    private final ImageCompressor imageCompressor;

    @Override
    @Transactional
    public ImageResponse uploadImage(MultipartFile file, String entityType, Long entityId) {
        validateNotEmpty(file);
        String contentType = resolveContentType(file);

        // Validate image format
        if (!ACCEPTED_IMAGE_FORMATS.contains(contentType.toLowerCase())) {
            throw new BusinessException(
                    "Unsupported image format: " + contentType + ". Accepted formats: JPEG, PNG, WebP, SVG",
                    "INVALID_IMAGE_FORMAT", HttpStatus.BAD_REQUEST);
        }

        // Validate size (max 5MB raw)
        if (file.getSize() > MAX_IMAGE_SIZE_BYTES) {
            throw new BusinessException(
                    "Image file size exceeds maximum allowed size of 5MB",
                    "IMAGE_TOO_LARGE", HttpStatus.BAD_REQUEST);
        }

        byte[] fileBytes = readFileBytes(file);
        String base64Data;
        Integer width = null;
        Integer height = null;

        if ("image/svg+xml".equalsIgnoreCase(contentType)) {
            // SVG: store as-is, no compression
            base64Data = Base64.getEncoder().encodeToString(fileBytes);
        } else {
            // Raster images: compress to max 500KB, validate min 100x100px
            String rawBase64 = Base64.getEncoder().encodeToString(fileBytes);
            try {
                int[] dimensions = imageCompressor.getDimensions(rawBase64);
                width = dimensions[0];
                height = dimensions[1];
                base64Data = imageCompressor.compress(rawBase64, contentType);
            } catch (ImageCompressor.ImageCompressionException e) {
                throw new BusinessException(e.getMessage(), "IMAGE_PROCESSING_ERROR", HttpStatus.BAD_REQUEST);
            }
        }

        // Create and save entity
        ProductImage image = new ProductImage();
        image.setBase64Data(base64Data);
        image.setMimeType(contentType);
        image.setMediaType(MediaType.IMAGE);
        image.setOriginalFilename(file.getOriginalFilename());
        image.setWidth(width);
        image.setHeight(height);
        image.setEntityType(entityType);
        image.setEntityId(entityId);

        ProductImage saved = productImageRepository.save(image);
        log.info("Image uploaded successfully: id={}, filename={}, entityType={}, entityId={}",
                saved.getId(), saved.getOriginalFilename(), entityType, entityId);

        return mapToImageResponse(saved);
    }

    @Override
    @Transactional
    public ImageResponse uploadVideo(MultipartFile file, String entityType, Long entityId) {
        validateNotEmpty(file);
        String contentType = resolveContentType(file);

        // Validate video format
        if (!ACCEPTED_VIDEO_FORMATS.contains(contentType.toLowerCase())) {
            throw new BusinessException(
                    "Unsupported video format: " + contentType + ". Accepted formats: MP4, WebM",
                    "INVALID_VIDEO_FORMAT", HttpStatus.BAD_REQUEST);
        }

        // Validate size (max 10MB)
        if (file.getSize() > MAX_VIDEO_SIZE_BYTES) {
            throw new BusinessException(
                    "Video file size exceeds maximum allowed size of 10MB",
                    "VIDEO_TOO_LARGE", HttpStatus.BAD_REQUEST);
        }

        byte[] fileBytes = readFileBytes(file);

        // Extract video duration by parsing container headers (MP4 mvhd box / WebM Duration element)
        Integer duration = extractVideoDuration(fileBytes, contentType);

        // Validate duration (max 10 seconds)
        if (duration != null && duration > MAX_VIDEO_DURATION_SECONDS) {
            throw new BusinessException(
                    "Video duration exceeds maximum allowed duration of " + MAX_VIDEO_DURATION_SECONDS + " seconds",
                    "VIDEO_TOO_LONG", HttpStatus.BAD_REQUEST);
        }

        // Encode as Base64
        String base64Data = Base64.getEncoder().encodeToString(fileBytes);

        // Create and save entity
        ProductImage video = new ProductImage();
        video.setBase64Data(base64Data);
        video.setMimeType(contentType);
        video.setMediaType(MediaType.VIDEO);
        video.setDuration(duration);
        video.setOriginalFilename(file.getOriginalFilename());
        video.setEntityType(entityType);
        video.setEntityId(entityId);

        ProductImage saved = productImageRepository.save(video);
        log.info("Video uploaded successfully: id={}, filename={}, duration={}s, entityType={}, entityId={}",
                saved.getId(), saved.getOriginalFilename(), duration, entityType, entityId);

        return mapToImageResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public ImageDataResponse getImage(Long imageId) {
        ProductImage image = productImageRepository.findById(imageId)
                .orElseThrow(() -> new BusinessException(
                        "Image not found with id: " + imageId,
                        "IMAGE_NOT_FOUND", HttpStatus.NOT_FOUND));

        return ImageDataResponse.builder()
                .id(image.getId())
                .base64Data(image.getBase64Data())
                .mimeType(image.getMimeType())
                .mediaType(image.getMediaType())
                .duration(image.getDuration())
                .originalFilename(image.getOriginalFilename())
                .width(image.getWidth())
                .height(image.getHeight())
                .build();
    }

    @Override
    @Transactional
    public void deleteImage(Long imageId) {
        ProductImage image = productImageRepository.findById(imageId)
                .orElseThrow(() -> new BusinessException(
                        "Image not found with id: " + imageId,
                        "IMAGE_NOT_FOUND", HttpStatus.NOT_FOUND));

        productImageRepository.delete(image);
        log.info("Image/video deleted: id={}, filename={}", imageId, image.getOriginalFilename());
    }

    // --- Private helper methods ---

    private void validateNotEmpty(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("File is empty or not provided", "FILE_EMPTY", HttpStatus.BAD_REQUEST);
        }
    }

    private String resolveContentType(MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType == null || contentType.isBlank()) {
            throw new BusinessException("Unable to determine file content type", "UNKNOWN_CONTENT_TYPE", HttpStatus.BAD_REQUEST);
        }
        return contentType;
    }

    private byte[] readFileBytes(MultipartFile file) {
        try {
            return file.getBytes();
        } catch (IOException e) {
            throw new BusinessException("Failed to read uploaded file: " + e.getMessage(),
                    "FILE_READ_ERROR", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Extracts video duration from file container headers.
     * For MP4 files, parses the 'mvhd' box to get the actual duration.
     * For WebM files, parses the EBML Duration element.
     * Falls back to file size heuristic if parsing fails.
     *
     * @param fileBytes   the raw video bytes
     * @param contentType the video MIME type
     * @return duration in seconds, or null if cannot determine
     */
    private Integer extractVideoDuration(byte[] fileBytes, String contentType) {
        try {
            if ("video/mp4".equalsIgnoreCase(contentType)) {
                return extractMp4Duration(fileBytes);
            } else if ("video/webm".equalsIgnoreCase(contentType)) {
                return extractWebmDuration(fileBytes);
            }
        } catch (Exception e) {
            log.warn("Failed to extract video duration from container headers, falling back to estimation", e);
        }
        // Fallback: estimate based on file size (~1 Mbps average bitrate)
        long fileSizeBytes = fileBytes.length;
        int estimatedSeconds = (int) (fileSizeBytes / (125L * 1024));
        return Math.max(1, estimatedSeconds);
    }

    /**
     * Parses MP4 'mvhd' (Movie Header) box to extract duration.
     * The mvhd box contains timescale and duration fields that give exact duration.
     */
    private Integer extractMp4Duration(byte[] data) {
        // Search for 'mvhd' box in the MP4 container
        byte[] mvhdMarker = {'m', 'v', 'h', 'd'};
        int offset = findBoxOffset(data, mvhdMarker);
        if (offset < 0) {
            return estimateFallback(data);
        }

        // mvhd box layout after the type field:
        // version (1 byte) + flags (3 bytes)
        // if version == 0: creation_time(4), modification_time(4), timescale(4), duration(4)
        // if version == 1: creation_time(8), modification_time(8), timescale(4), duration(8)
        int pos = offset + 4; // skip the box type
        if (pos >= data.length) return estimateFallback(data);

        int version = data[pos] & 0xFF;
        pos += 4; // skip version + flags

        long timescale;
        long duration;

        if (version == 0) {
            pos += 8; // skip creation_time(4) + modification_time(4)
            if (pos + 8 > data.length) return estimateFallback(data);
            timescale = readUint32(data, pos);
            pos += 4;
            duration = readUint32(data, pos);
        } else {
            pos += 16; // skip creation_time(8) + modification_time(8)
            if (pos + 12 > data.length) return estimateFallback(data);
            timescale = readUint32(data, pos);
            pos += 4;
            duration = readUint64(data, pos);
        }

        if (timescale <= 0) return estimateFallback(data);
        int seconds = (int) (duration / timescale);
        return Math.max(1, seconds);
    }

    /**
     * Parses WebM/Matroska Duration element from the Segment Info section.
     * WebM uses EBML encoding with specific element IDs.
     */
    private Integer extractWebmDuration(byte[] data) {
        // WebM Duration element ID: 0x4489
        // Search for it in the file header area (usually within first 1KB-4KB)
        int searchLimit = Math.min(data.length, 8192);
        for (int i = 0; i < searchLimit - 8; i++) {
            if ((data[i] & 0xFF) == 0x44 && (data[i + 1] & 0xFF) == 0x89) {
                // Found Duration element ID, next byte(s) are the size
                int sizePos = i + 2;
                if (sizePos >= searchLimit) break;
                int sizeByte = data[sizePos] & 0xFF;
                int dataSize;
                int dataPos;

                if ((sizeByte & 0x80) != 0) {
                    // 1-byte size
                    dataSize = sizeByte & 0x7F;
                    dataPos = sizePos + 1;
                } else if ((sizeByte & 0x40) != 0) {
                    // 2-byte size
                    if (sizePos + 1 >= searchLimit) break;
                    dataSize = ((sizeByte & 0x3F) << 8) | (data[sizePos + 1] & 0xFF);
                    dataPos = sizePos + 2;
                } else {
                    continue;
                }

                if (dataSize == 8 && dataPos + 8 <= data.length) {
                    // Duration is stored as a float64 in nanoseconds (or milliseconds depending on TimecodeScale)
                    long bits = 0;
                    for (int j = 0; j < 8; j++) {
                        bits = (bits << 8) | (data[dataPos + j] & 0xFF);
                    }
                    double durationMs = Double.longBitsToDouble(bits);
                    // WebM duration is typically in milliseconds
                    int seconds = (int) (durationMs / 1000.0);
                    if (seconds > 0 && seconds < 3600) { // sanity check
                        return seconds;
                    }
                } else if (dataSize == 4 && dataPos + 4 <= data.length) {
                    int bits = 0;
                    for (int j = 0; j < 4; j++) {
                        bits = (bits << 8) | (data[dataPos + j] & 0xFF);
                    }
                    double durationMs = Float.intBitsToFloat(bits);
                    int seconds = (int) (durationMs / 1000.0);
                    if (seconds > 0 && seconds < 3600) {
                        return seconds;
                    }
                }
            }
        }
        return estimateFallback(data);
    }

    private int findBoxOffset(byte[] data, byte[] marker) {
        int searchLimit = data.length - marker.length;
        for (int i = 0; i < searchLimit; i++) {
            boolean found = true;
            for (int j = 0; j < marker.length; j++) {
                if (data[i + j] != marker[j]) {
                    found = false;
                    break;
                }
            }
            if (found) return i;
        }
        return -1;
    }

    private long readUint32(byte[] data, int offset) {
        return ((long) (data[offset] & 0xFF) << 24) |
               ((long) (data[offset + 1] & 0xFF) << 16) |
               ((long) (data[offset + 2] & 0xFF) << 8) |
               ((long) (data[offset + 3] & 0xFF));
    }

    private long readUint64(byte[] data, int offset) {
        return ((long) (data[offset] & 0xFF) << 56) |
               ((long) (data[offset + 1] & 0xFF) << 48) |
               ((long) (data[offset + 2] & 0xFF) << 40) |
               ((long) (data[offset + 3] & 0xFF) << 32) |
               ((long) (data[offset + 4] & 0xFF) << 24) |
               ((long) (data[offset + 5] & 0xFF) << 16) |
               ((long) (data[offset + 6] & 0xFF) << 8) |
               ((long) (data[offset + 7] & 0xFF));
    }

    private Integer estimateFallback(byte[] data) {
        long fileSizeBytes = data.length;
        int estimatedSeconds = (int) (fileSizeBytes / (125L * 1024));
        return Math.max(1, estimatedSeconds);
    }

    private ImageResponse mapToImageResponse(ProductImage image) {
        return ImageResponse.builder()
                .id(image.getId())
                .mimeType(image.getMimeType())
                .mediaType(image.getMediaType())
                .duration(image.getDuration())
                .originalFilename(image.getOriginalFilename())
                .width(image.getWidth())
                .height(image.getHeight())
                .entityType(image.getEntityType())
                .entityId(image.getEntityId())
                .uploadedAt(image.getUploadedAt())
                .build();
    }
}
