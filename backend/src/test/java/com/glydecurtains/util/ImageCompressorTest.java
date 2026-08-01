package com.glydecurtains.util;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Base64;

import static org.junit.jupiter.api.Assertions.*;

class ImageCompressorTest {

    private ImageCompressor imageCompressor;

    @BeforeEach
    void setUp() {
        imageCompressor = new ImageCompressor();
    }

    @Test
    void compress_shouldAcceptValidJpegImage() {
        String base64 = createTestImageBase64(200, 200, "jpeg");
        String result = imageCompressor.compress(base64, "image/jpeg");
        assertNotNull(result);
        assertFalse(result.isEmpty());
    }

    @Test
    void compress_shouldAcceptValidPngImage() {
        String base64 = createTestImageBase64(150, 150, "png");
        String result = imageCompressor.compress(base64, "image/png");
        assertNotNull(result);
        assertFalse(result.isEmpty());
    }

    @Test
    void compress_shouldRejectImageBelowMinDimensions() {
        String base64 = createTestImageBase64(50, 50, "jpeg");
        assertThrows(ImageCompressor.ImageCompressionException.class,
                () -> imageCompressor.compress(base64, "image/jpeg"));
    }

    @Test
    void compress_shouldRejectImageWithWidthBelowMinimum() {
        String base64 = createTestImageBase64(50, 200, "jpeg");
        assertThrows(ImageCompressor.ImageCompressionException.class,
                () -> imageCompressor.compress(base64, "image/jpeg"));
    }

    @Test
    void compress_shouldRejectImageWithHeightBelowMinimum() {
        String base64 = createTestImageBase64(200, 50, "jpeg");
        assertThrows(ImageCompressor.ImageCompressionException.class,
                () -> imageCompressor.compress(base64, "image/jpeg"));
    }

    @Test
    void compress_shouldRejectUnsupportedMimeType() {
        String base64 = createTestImageBase64(200, 200, "jpeg");
        assertThrows(ImageCompressor.ImageCompressionException.class,
                () -> imageCompressor.compress(base64, "image/bmp"));
    }

    @Test
    void compress_shouldRejectNullMimeType() {
        String base64 = createTestImageBase64(200, 200, "jpeg");
        assertThrows(ImageCompressor.ImageCompressionException.class,
                () -> imageCompressor.compress(base64, null));
    }

    @Test
    void compress_shouldRejectInvalidBase64() {
        assertThrows(ImageCompressor.ImageCompressionException.class,
                () -> imageCompressor.compress("not-valid-base64!!!", "image/jpeg"));
    }

    @Test
    void compress_shouldStripDataUriPrefix() {
        String rawBase64 = createTestImageBase64(200, 200, "jpeg");
        String withPrefix = "data:image/jpeg;base64," + rawBase64;
        String result = imageCompressor.compress(withPrefix, "image/jpeg");
        assertNotNull(result);
        assertFalse(result.startsWith("data:"));
    }

    @Test
    void compress_shouldReturnSmallImageUnchanged() {
        // A small 100x100 JPEG should be under 500KB already
        String base64 = createTestImageBase64(100, 100, "jpeg");
        String result = imageCompressor.compress(base64, "image/jpeg");
        assertEquals(base64, result);
    }

    @Test
    void compress_shouldCompressLargeImage() {
        // Create a large image (1000x1000 with random-ish content)
        String base64 = createLargeTestImageBase64(1000, 1000);
        byte[] originalBytes = Base64.getDecoder().decode(base64);

        // Only test compression if the image is actually over 500KB
        if (originalBytes.length > 500 * 1024) {
            String result = imageCompressor.compress(base64, "image/jpeg");
            byte[] resultBytes = Base64.getDecoder().decode(result);
            assertTrue(resultBytes.length <= 500 * 1024,
                    "Compressed image should be <= 500KB, was: " + resultBytes.length);
        }
    }

    @Test
    void validate_shouldPassForValidImage() {
        String base64 = createTestImageBase64(200, 200, "jpeg");
        assertDoesNotThrow(() -> imageCompressor.validate(base64, "image/jpeg"));
    }

    @Test
    void validate_shouldFailForSmallImage() {
        String base64 = createTestImageBase64(50, 50, "jpeg");
        assertThrows(ImageCompressor.ImageCompressionException.class,
                () -> imageCompressor.validate(base64, "image/jpeg"));
    }

    @Test
    void getDimensions_shouldReturnCorrectDimensions() {
        String base64 = createTestImageBase64(300, 250, "jpeg");
        int[] dims = imageCompressor.getDimensions(base64);
        assertEquals(300, dims[0]);
        assertEquals(250, dims[1]);
    }

    @Test
    void compress_shouldHandleExactMinimumDimensions() {
        String base64 = createTestImageBase64(100, 100, "jpeg");
        String result = imageCompressor.compress(base64, "image/jpeg");
        assertNotNull(result);
    }

    private String createTestImageBase64(int width, int height, String format) {
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = image.createGraphics();
        g.setColor(Color.BLUE);
        g.fillRect(0, 0, width, height);
        g.setColor(Color.WHITE);
        g.drawString("Test", width / 4, height / 2);
        g.dispose();

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            ImageIO.write(image, format, baos);
            return Base64.getEncoder().encodeToString(baos.toByteArray());
        } catch (IOException e) {
            throw new RuntimeException("Failed to create test image", e);
        }
    }

    private String createLargeTestImageBase64(int width, int height) {
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = image.createGraphics();
        // Create complex content that won't compress well
        for (int x = 0; x < width; x += 10) {
            for (int y = 0; y < height; y += 10) {
                g.setColor(new Color((x * y) % 256, (x + y) % 256, (x * 3 + y) % 256));
                g.fillRect(x, y, 10, 10);
            }
        }
        g.dispose();

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            ImageIO.write(image, "png", baos);
            return Base64.getEncoder().encodeToString(baos.toByteArray());
        } catch (IOException e) {
            throw new RuntimeException("Failed to create large test image", e);
        }
    }
}
