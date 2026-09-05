package com.glydecurtains.service;

import com.glydecurtains.dto.response.ImageDataResponse;
import com.glydecurtains.dto.response.ImageResponse;
import com.glydecurtains.entity.ProductImage;
import com.glydecurtains.entity.enums.MediaType;
import com.glydecurtains.exception.BusinessException;
import com.glydecurtains.repository.ProductImageRepository;
import com.glydecurtains.service.impl.ImageServiceImpl;
import com.glydecurtains.util.ImageCompressor;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Base64;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ImageServiceTest {

    @Mock
    private ProductImageRepository productImageRepository;

    @Mock
    private ImageCompressor imageCompressor;

    @InjectMocks
    private ImageServiceImpl imageService;

    private static final String ENTITY_TYPE = "product";
    private static final Long ENTITY_ID = 1L;

    @Nested
    @DisplayName("Upload Image")
    class UploadImageTests {

        @Test
        @DisplayName("should upload JPEG image with Base64 encoding and return metadata")
        void uploadImage_withValidJpeg_shouldEncodeAndReturnResponse() throws IOException {
            byte[] imageBytes = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 0x01, 0x02};
            String expectedBase64 = Base64.getEncoder().encodeToString(imageBytes);

            MultipartFile file = mock(MultipartFile.class);
            when(file.isEmpty()).thenReturn(false);
            when(file.getContentType()).thenReturn("image/jpeg");
            when(file.getSize()).thenReturn(1024L);
            when(file.getBytes()).thenReturn(imageBytes);
            when(file.getOriginalFilename()).thenReturn("photo.jpg");

            when(imageCompressor.getDimensions(expectedBase64)).thenReturn(new int[]{800, 600});
            when(imageCompressor.compress(expectedBase64, "image/jpeg")).thenReturn(expectedBase64);

            ProductImage saved = new ProductImage();
            saved.setId(10L);
            saved.setBase64Data(expectedBase64);
            saved.setMimeType("image/jpeg");
            saved.setMediaType(MediaType.IMAGE);
            saved.setOriginalFilename("photo.jpg");
            saved.setWidth(800);
            saved.setHeight(600);
            saved.setEntityType(ENTITY_TYPE);
            saved.setEntityId(ENTITY_ID);

            when(productImageRepository.save(any(ProductImage.class))).thenReturn(saved);

            ImageResponse response = imageService.uploadImage(file, ENTITY_TYPE, ENTITY_ID);

            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(10L);
            assertThat(response.getMimeType()).isEqualTo("image/jpeg");
            assertThat(response.getMediaType()).isEqualTo(MediaType.IMAGE);
            assertThat(response.getOriginalFilename()).isEqualTo("photo.jpg");
            assertThat(response.getWidth()).isEqualTo(800);
            assertThat(response.getHeight()).isEqualTo(600);
            assertThat(response.getEntityType()).isEqualTo(ENTITY_TYPE);
            assertThat(response.getEntityId()).isEqualTo(ENTITY_ID);

            verify(imageCompressor).getDimensions(expectedBase64);
            verify(imageCompressor).compress(expectedBase64, "image/jpeg");
            verify(productImageRepository).save(any(ProductImage.class));
        }

        @Test
        @DisplayName("should upload SVG image as-is without compression")
        void uploadImage_withSvg_shouldStoreWithoutCompression() throws IOException {
            byte[] svgBytes = "<svg><rect/></svg>".getBytes();

            MultipartFile file = mock(MultipartFile.class);
            when(file.isEmpty()).thenReturn(false);
            when(file.getContentType()).thenReturn("image/svg+xml");
            when(file.getSize()).thenReturn((long) svgBytes.length);
            when(file.getBytes()).thenReturn(svgBytes);
            when(file.getOriginalFilename()).thenReturn("icon.svg");

            ProductImage saved = new ProductImage();
            saved.setId(11L);
            saved.setMimeType("image/svg+xml");
            saved.setMediaType(MediaType.IMAGE);
            saved.setOriginalFilename("icon.svg");
            saved.setEntityType(ENTITY_TYPE);
            saved.setEntityId(ENTITY_ID);

            when(productImageRepository.save(any(ProductImage.class))).thenReturn(saved);

            ImageResponse response = imageService.uploadImage(file, ENTITY_TYPE, ENTITY_ID);

            assertThat(response).isNotNull();
            assertThat(response.getMimeType()).isEqualTo("image/svg+xml");
            assertThat(response.getWidth()).isNull();
            assertThat(response.getHeight()).isNull();

            // SVG should not trigger compression
            verifyNoInteractions(imageCompressor);
            verify(productImageRepository).save(any(ProductImage.class));
        }

        @Test
        @DisplayName("should throw BusinessException when image format is unsupported")
        void uploadImage_withUnsupportedFormat_shouldThrowException() {
            MultipartFile file = mock(MultipartFile.class);
            when(file.isEmpty()).thenReturn(false);
            when(file.getContentType()).thenReturn("image/gif");
            when(file.getSize()).thenReturn(1024L);

            assertThatThrownBy(() -> imageService.uploadImage(file, ENTITY_TYPE, ENTITY_ID))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Unsupported image format");
        }

        @Test
        @DisplayName("should throw BusinessException when file is empty")
        void uploadImage_withEmptyFile_shouldThrowException() {
            MultipartFile file = mock(MultipartFile.class);
            when(file.isEmpty()).thenReturn(true);

            assertThatThrownBy(() -> imageService.uploadImage(file, ENTITY_TYPE, ENTITY_ID))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("empty");
        }

        @Test
        @DisplayName("should throw BusinessException when file exceeds 5MB max size")
        void uploadImage_withFileTooLarge_shouldThrowException() {
            long overFiveMb = 5L * 1024 * 1024 + 1;

            MultipartFile file = mock(MultipartFile.class);
            when(file.isEmpty()).thenReturn(false);
            when(file.getContentType()).thenReturn("image/png");
            when(file.getSize()).thenReturn(overFiveMb);

            assertThatThrownBy(() -> imageService.uploadImage(file, ENTITY_TYPE, ENTITY_ID))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("5MB");
        }
    }

    @Nested
    @DisplayName("Compress Image")
    class CompressImageTests {

        @Test
        @DisplayName("should compress raster image exceeding max 500KB via ImageCompressor")
        void uploadImage_withLargeRasterImage_shouldCompress() throws IOException {
            // A file under 5MB raw but large enough that compression is needed
            byte[] imageBytes = new byte[600 * 1024]; // 600KB
            String rawBase64 = Base64.getEncoder().encodeToString(imageBytes);
            String compressedBase64 = "compressedImageData";

            MultipartFile file = mock(MultipartFile.class);
            when(file.isEmpty()).thenReturn(false);
            when(file.getContentType()).thenReturn("image/png");
            when(file.getSize()).thenReturn((long) imageBytes.length);
            when(file.getBytes()).thenReturn(imageBytes);
            when(file.getOriginalFilename()).thenReturn("large-banner.png");

            when(imageCompressor.getDimensions(rawBase64)).thenReturn(new int[]{1920, 1080});
            when(imageCompressor.compress(rawBase64, "image/png")).thenReturn(compressedBase64);

            ProductImage saved = new ProductImage();
            saved.setId(12L);
            saved.setBase64Data(compressedBase64);
            saved.setMimeType("image/png");
            saved.setMediaType(MediaType.IMAGE);
            saved.setOriginalFilename("large-banner.png");
            saved.setWidth(1920);
            saved.setHeight(1080);
            saved.setEntityType(ENTITY_TYPE);
            saved.setEntityId(ENTITY_ID);

            when(productImageRepository.save(any(ProductImage.class))).thenReturn(saved);

            ImageResponse response = imageService.uploadImage(file, ENTITY_TYPE, ENTITY_ID);

            assertThat(response).isNotNull();
            assertThat(response.getWidth()).isEqualTo(1920);
            assertThat(response.getHeight()).isEqualTo(1080);
            verify(imageCompressor).compress(rawBase64, "image/png");
        }

        @Test
        @DisplayName("should throw BusinessException when ImageCompressor reports compression failure")
        void uploadImage_whenCompressionFails_shouldThrowException() throws IOException {
            byte[] imageBytes = new byte[]{1, 2, 3, 4};
            String rawBase64 = Base64.getEncoder().encodeToString(imageBytes);

            MultipartFile file = mock(MultipartFile.class);
            when(file.isEmpty()).thenReturn(false);
            when(file.getContentType()).thenReturn("image/webp");
            when(file.getSize()).thenReturn(4L);
            when(file.getBytes()).thenReturn(imageBytes);

            when(imageCompressor.getDimensions(rawBase64)).thenReturn(new int[]{200, 200});
            when(imageCompressor.compress(rawBase64, "image/webp"))
                    .thenThrow(new ImageCompressor.ImageCompressionException("Unable to decode image"));

            assertThatThrownBy(() -> imageService.uploadImage(file, ENTITY_TYPE, ENTITY_ID))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Unable to decode image");
        }
    }

    @Nested
    @DisplayName("Validate Image Dimensions")
    class ValidateDimensionsTests {

        @Test
        @DisplayName("should throw BusinessException when image dimensions are below 100x100 minimum")
        void uploadImage_withDimensionsBelowMinimum_shouldThrowException() throws IOException {
            byte[] imageBytes = new byte[]{1, 2, 3};
            String rawBase64 = Base64.getEncoder().encodeToString(imageBytes);

            MultipartFile file = mock(MultipartFile.class);
            when(file.isEmpty()).thenReturn(false);
            when(file.getContentType()).thenReturn("image/jpeg");
            when(file.getSize()).thenReturn(3L);
            when(file.getBytes()).thenReturn(imageBytes);

            when(imageCompressor.getDimensions(rawBase64))
                    .thenThrow(new ImageCompressor.ImageCompressionException(
                            "Image dimensions 50x50 are below minimum required 100x100"));

            assertThatThrownBy(() -> imageService.uploadImage(file, ENTITY_TYPE, ENTITY_ID))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("below minimum required 100x100");
        }

        @Test
        @DisplayName("should accept image with exactly 100x100 minimum dimensions")
        void uploadImage_withExactMinimumDimensions_shouldSucceed() throws IOException {
            byte[] imageBytes = new byte[]{10, 20, 30};
            String rawBase64 = Base64.getEncoder().encodeToString(imageBytes);

            MultipartFile file = mock(MultipartFile.class);
            when(file.isEmpty()).thenReturn(false);
            when(file.getContentType()).thenReturn("image/jpeg");
            when(file.getSize()).thenReturn(3L);
            when(file.getBytes()).thenReturn(imageBytes);
            when(file.getOriginalFilename()).thenReturn("small.jpg");

            when(imageCompressor.getDimensions(rawBase64)).thenReturn(new int[]{100, 100});
            when(imageCompressor.compress(rawBase64, "image/jpeg")).thenReturn(rawBase64);

            ProductImage saved = new ProductImage();
            saved.setId(13L);
            saved.setMimeType("image/jpeg");
            saved.setMediaType(MediaType.IMAGE);
            saved.setOriginalFilename("small.jpg");
            saved.setWidth(100);
            saved.setHeight(100);
            saved.setEntityType(ENTITY_TYPE);
            saved.setEntityId(ENTITY_ID);

            when(productImageRepository.save(any(ProductImage.class))).thenReturn(saved);

            ImageResponse response = imageService.uploadImage(file, ENTITY_TYPE, ENTITY_ID);

            assertThat(response).isNotNull();
            assertThat(response.getWidth()).isEqualTo(100);
            assertThat(response.getHeight()).isEqualTo(100);
        }
    }

    @Nested
    @DisplayName("Delete Image")
    class DeleteImageTests {

        @Test
        @DisplayName("should delete ProductImage record when image exists")
        void deleteImage_withExistingId_shouldDeleteSuccessfully() {
            ProductImage image = new ProductImage();
            image.setId(5L);
            image.setOriginalFilename("to-delete.jpg");
            image.setMimeType("image/jpeg");
            image.setMediaType(MediaType.IMAGE);

            when(productImageRepository.findById(5L)).thenReturn(Optional.of(image));

            imageService.deleteImage(5L);

            verify(productImageRepository).delete(image);
        }

        @Test
        @DisplayName("should throw BusinessException when image not found for deletion")
        void deleteImage_withNonExistentId_shouldThrowException() {
            when(productImageRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> imageService.deleteImage(99L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Image not found");
        }
    }
}
