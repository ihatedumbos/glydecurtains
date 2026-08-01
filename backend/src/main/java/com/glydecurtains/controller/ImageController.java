package com.glydecurtains.controller;

import com.glydecurtains.dto.response.ApiResponse;
import com.glydecurtains.dto.response.ImageDataResponse;
import com.glydecurtains.dto.response.ImageResponse;
import com.glydecurtains.security.RequiresPermission;
import com.glydecurtains.service.ImageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/images")
@RequiredArgsConstructor
public class ImageController {

    private final ImageService imageService;

    /**
     * Upload an image file.
     * Accepts JPEG, PNG, WebP, SVG formats. Max size: 5MB.
     * Raster images are compressed to max 500KB with min 100x100px validation.
     * SVG files are stored as-is.
     */
    @PostMapping("/upload")
    @RequiresPermission(entity = "products", operation = "CREATE")
    public ResponseEntity<ApiResponse<ImageResponse>> uploadImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "entityType", defaultValue = "product") String entityType,
            @RequestParam(value = "entityId", required = false) Long entityId) {

        ImageResponse response = imageService.uploadImage(file, entityType, entityId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Image uploaded successfully", response));
    }

    /**
     * Upload a video file.
     * Accepts MP4, WebM formats. Max size: 10MB. Max duration: 10 seconds.
     * Video is Base64-encoded and stored with mediaType=VIDEO.
     */
    @PostMapping("/upload-video")
    @RequiresPermission(entity = "products", operation = "CREATE")
    public ResponseEntity<ApiResponse<ImageResponse>> uploadVideo(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "entityType", defaultValue = "product") String entityType,
            @RequestParam(value = "entityId", required = false) Long entityId) {

        ImageResponse response = imageService.uploadVideo(file, entityType, entityId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Video uploaded successfully", response));
    }

    /**
     * Retrieve image/video data by ID.
     * Returns the Base64 data with Cache-Control: max-age=86400 header.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ImageDataResponse>> getImage(@PathVariable Long id) {
        ImageDataResponse response = imageService.getImage(id);
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(86400, TimeUnit.SECONDS))
                .body(ApiResponse.success(response));
    }

    /**
     * Delete an image/video by ID.
     */
    @DeleteMapping("/{id}")
    @RequiresPermission(entity = "products", operation = "DELETE")
    public ResponseEntity<ApiResponse<Void>> deleteImage(@PathVariable Long id) {
        imageService.deleteImage(id);
        return ResponseEntity.ok(ApiResponse.success("Image deleted successfully", null));
    }
}
