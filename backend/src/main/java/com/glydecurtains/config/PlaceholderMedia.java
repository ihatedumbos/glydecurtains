package com.glydecurtains.config;

/**
 * Recognises the 1x1 placeholder JPEGs (raw base64, ~380 characters) that older seed data
 * used instead of real photos. Real uploads are far larger, and bundled photos are stored as paths.
 */
final class PlaceholderMedia {

    static final int MAX_LENGTH = 1024;

    private PlaceholderMedia() {
    }

    static boolean isPlaceholder(String data) {
        if (data == null || data.isBlank()) {
            return true;
        }
        String trimmed = data.trim();
        boolean isPath = trimmed.startsWith("/")
                && trimmed.matches("^/[\\w\\-./#% ()]+\\.(?i)(jpe?g|png|webp|gif|avif|mp4|mov|webm|m4v)$");
        return !isPath && !trimmed.startsWith("http") && trimmed.length() <= MAX_LENGTH;
    }
}
