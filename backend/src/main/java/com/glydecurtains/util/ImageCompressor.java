package com.glydecurtains.util;

import org.springframework.stereotype.Component;

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageOutputStream;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Base64;
import java.util.Iterator;
import java.util.Set;

/**
 * Utility for compressing Base64-encoded images.
 * Validates minimum dimensions (100x100 pixels) and compresses to maximum 500KB.
 * Supports JPEG, PNG, and WebP formats.
 */
@Component
public class ImageCompressor {

    private static final int MAX_SIZE_BYTES = 500 * 1024; // 500KB
    private static final int MIN_WIDTH = 100;
    private static final int MIN_HEIGHT = 100;
    private static final Set<String> SUPPORTED_FORMATS = Set.of("image/jpeg", "image/png", "image/webp");
    private static final float INITIAL_QUALITY = 0.85f;
    private static final float MIN_QUALITY = 0.3f;
    private static final float QUALITY_STEP = 0.1f;

    /**
     * Compresses a Base64-encoded image to maximum 500KB while validating minimum dimensions.
     *
     * @param base64Image the Base64-encoded image string (may include data URI prefix)
     * @param mimeType    the MIME type of the image (e.g., "image/jpeg", "image/png", "image/webp")
     * @return the compressed Base64-encoded image string (without data URI prefix)
     * @throws ImageCompressionException if the image fails validation or cannot be compressed
     */
    public String compress(String base64Image, String mimeType) {
        validateMimeType(mimeType);

        byte[] imageBytes = decodeBase64(base64Image);
        BufferedImage image = readImage(imageBytes);

        validateDimensions(image);

        // If already under max size, return as-is (cleaned of any data URI prefix)
        if (imageBytes.length <= MAX_SIZE_BYTES) {
            return stripDataUriPrefix(base64Image);
        }

        // Compress the image
        byte[] compressed = compressImage(image, mimeType);
        return Base64.getEncoder().encodeToString(compressed);
    }

    /**
     * Validates an image without compressing. Checks format, decoding, and dimensions.
     *
     * @param base64Image the Base64-encoded image string
     * @param mimeType    the MIME type of the image
     * @throws ImageCompressionException if the image fails validation
     */
    public void validate(String base64Image, String mimeType) {
        validateMimeType(mimeType);
        byte[] imageBytes = decodeBase64(base64Image);
        BufferedImage image = readImage(imageBytes);
        validateDimensions(image);
    }

    /**
     * Gets the dimensions of a Base64-encoded image.
     *
     * @param base64Image the Base64-encoded image string
     * @return an int array [width, height]
     * @throws ImageCompressionException if the image cannot be decoded
     */
    public int[] getDimensions(String base64Image) {
        byte[] imageBytes = decodeBase64(base64Image);
        BufferedImage image = readImage(imageBytes);
        return new int[]{image.getWidth(), image.getHeight()};
    }

    private void validateMimeType(String mimeType) {
        if (mimeType == null || !SUPPORTED_FORMATS.contains(mimeType.toLowerCase())) {
            throw new ImageCompressionException(
                    "Unsupported image format: " + mimeType + ". Supported formats: JPEG, PNG, WebP");
        }
    }

    private void validateDimensions(BufferedImage image) {
        if (image.getWidth() < MIN_WIDTH || image.getHeight() < MIN_HEIGHT) {
            throw new ImageCompressionException(
                    String.format("Image dimensions %dx%d are below minimum required %dx%d",
                            image.getWidth(), image.getHeight(), MIN_WIDTH, MIN_HEIGHT));
        }
    }

    private byte[] decodeBase64(String base64Image) {
        try {
            String cleaned = stripDataUriPrefix(base64Image);
            return Base64.getDecoder().decode(cleaned);
        } catch (IllegalArgumentException e) {
            throw new ImageCompressionException("Invalid Base64 encoding: " + e.getMessage());
        }
    }

    private BufferedImage readImage(byte[] imageBytes) {
        try {
            BufferedImage image = ImageIO.read(new ByteArrayInputStream(imageBytes));
            if (image == null) {
                throw new ImageCompressionException("Unable to decode image - unsupported or corrupted format");
            }
            return image;
        } catch (IOException e) {
            throw new ImageCompressionException("Failed to read image: " + e.getMessage());
        }
    }

    private byte[] compressImage(BufferedImage image, String mimeType) {
        String formatName = getFormatName(mimeType);

        // For PNG, convert to JPEG for better compression if still over max size
        if ("png".equalsIgnoreCase(formatName)) {
            byte[] pngBytes = writeImage(image, "png", 1.0f);
            if (pngBytes.length <= MAX_SIZE_BYTES) {
                return pngBytes;
            }
            // Convert PNG with transparency to RGB for JPEG compression
            image = convertToRgb(image);
            formatName = "jpeg";
        }

        // Progressive quality reduction until under max size
        float quality = INITIAL_QUALITY;
        byte[] result;

        do {
            result = writeImage(image, formatName, quality);
            quality -= QUALITY_STEP;
        } while (result.length > MAX_SIZE_BYTES && quality >= MIN_QUALITY);

        // If still over max size after minimum quality, scale down
        if (result.length > MAX_SIZE_BYTES) {
            image = scaleDown(image, result.length);
            result = writeImage(image, formatName, MIN_QUALITY);
        }

        return result;
    }

    private byte[] writeImage(BufferedImage image, String formatName, float quality) {
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            if ("jpeg".equalsIgnoreCase(formatName) || "jpg".equalsIgnoreCase(formatName)) {
                writeJpeg(image, baos, quality);
            } else {
                ImageIO.write(image, formatName, baos);
            }
            return baos.toByteArray();
        } catch (IOException e) {
            throw new ImageCompressionException("Failed to compress image: " + e.getMessage());
        }
    }

    private void writeJpeg(BufferedImage image, ByteArrayOutputStream baos, float quality) throws IOException {
        Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName("jpeg");
        if (!writers.hasNext()) {
            throw new ImageCompressionException("JPEG writer not available");
        }

        ImageWriter writer = writers.next();
        try (ImageOutputStream ios = ImageIO.createImageOutputStream(baos)) {
            writer.setOutput(ios);

            ImageWriteParam params = writer.getDefaultWriteParam();
            params.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
            params.setCompressionQuality(quality);

            writer.write(null, new IIOImage(image, null, null), params);
        } finally {
            writer.dispose();
        }
    }

    private BufferedImage convertToRgb(BufferedImage image) {
        BufferedImage rgbImage = new BufferedImage(
                image.getWidth(), image.getHeight(), BufferedImage.TYPE_INT_RGB);
        Graphics2D g = rgbImage.createGraphics();
        g.setColor(Color.WHITE);
        g.fillRect(0, 0, image.getWidth(), image.getHeight());
        g.drawImage(image, 0, 0, null);
        g.dispose();
        return rgbImage;
    }

    private BufferedImage scaleDown(BufferedImage image, int currentSize) {
        double scaleFactor = Math.sqrt((double) MAX_SIZE_BYTES / currentSize) * 0.9;
        int newWidth = (int) (image.getWidth() * scaleFactor);
        int newHeight = (int) (image.getHeight() * scaleFactor);

        // Ensure we don't go below minimum dimensions
        newWidth = Math.max(newWidth, MIN_WIDTH);
        newHeight = Math.max(newHeight, MIN_HEIGHT);

        BufferedImage scaled = new BufferedImage(newWidth, newHeight, image.getType());
        Graphics2D g = scaled.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g.drawImage(image, 0, 0, newWidth, newHeight, null);
        g.dispose();
        return scaled;
    }

    private String getFormatName(String mimeType) {
        return switch (mimeType.toLowerCase()) {
            case "image/jpeg" -> "jpeg";
            case "image/png" -> "png";
            case "image/webp" -> "webp";
            default -> "jpeg";
        };
    }

    private String stripDataUriPrefix(String base64Image) {
        if (base64Image != null && base64Image.contains(",")) {
            return base64Image.substring(base64Image.indexOf(",") + 1);
        }
        return base64Image;
    }

    /**
     * Exception thrown when image compression or validation fails.
     */
    public static class ImageCompressionException extends RuntimeException {
        public ImageCompressionException(String message) {
            super(message);
        }
    }
}
