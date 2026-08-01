package com.glydecurtains.validation;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class SanitizationAspectTest {

    @Test
    void stripAllHtml_shouldRemoveScriptTags() {
        String input = "Hello <script>alert('xss')</script> World";
        String result = SanitizationAspect.stripAllHtml(input);
        assertFalse(result.contains("<script>"));
        assertFalse(result.contains("alert"));
        assertTrue(result.contains("Hello"));
        assertTrue(result.contains("World"));
    }

    @Test
    void stripAllHtml_shouldRemoveAllHtmlTags() {
        String input = "<p>Hello <b>World</b></p>";
        String result = SanitizationAspect.stripAllHtml(input);
        assertFalse(result.contains("<p>"));
        assertFalse(result.contains("<b>"));
        assertTrue(result.contains("Hello"));
        assertTrue(result.contains("World"));
    }

    @Test
    void stripAllHtml_shouldHandleNullInput() {
        assertNull(SanitizationAspect.stripAllHtml(null));
    }

    @Test
    void stripAllHtml_shouldHandleEmptyString() {
        assertEquals("", SanitizationAspect.stripAllHtml(""));
    }

    @Test
    void stripAllHtml_shouldRemoveOnEventHandlers() {
        String input = "<div onmouseover=\"alert('xss')\">text</div>";
        String result = SanitizationAspect.stripAllHtml(input);
        assertFalse(result.contains("onmouseover"));
        assertFalse(result.contains("alert"));
        assertTrue(result.contains("text"));
    }

    @Test
    void stripAllHtml_shouldRemoveIframeTags() {
        String input = "Before <iframe src=\"evil.com\"></iframe> After";
        String result = SanitizationAspect.stripAllHtml(input);
        assertFalse(result.contains("<iframe"));
        assertTrue(result.contains("Before"));
        assertTrue(result.contains("After"));
    }

    @Test
    void sanitizeRichText_shouldAllowBasicFormattingTags() {
        String input = "<p>Hello <b>World</b> <em>italic</em></p>";
        String result = SanitizationAspect.sanitizeRichText(input);
        assertTrue(result.contains("<p>"));
        assertTrue(result.contains("<b>"));
        assertTrue(result.contains("<em>"));
    }

    @Test
    void sanitizeRichText_shouldRemoveScriptTags() {
        String input = "<p>Hello</p><script>alert('xss')</script>";
        String result = SanitizationAspect.sanitizeRichText(input);
        assertTrue(result.contains("<p>"));
        assertFalse(result.contains("<script>"));
        assertFalse(result.contains("alert"));
    }

    @Test
    void sanitizeRichText_shouldAllowLinks() {
        String input = "<a href=\"https://example.com\">Link</a>";
        String result = SanitizationAspect.sanitizeRichText(input);
        assertTrue(result.contains("<a"));
        assertTrue(result.contains("href"));
        assertTrue(result.contains("Link"));
    }

    @Test
    void sanitizeRichText_shouldRemoveDangerousAttributes() {
        String input = "<p onclick=\"alert('xss')\">text</p>";
        String result = SanitizationAspect.sanitizeRichText(input);
        assertTrue(result.contains("<p>"));
        assertFalse(result.contains("onclick"));
    }

    @Test
    void sanitizeRichText_shouldAllowListElements() {
        String input = "<ul><li>Item 1</li><li>Item 2</li></ul>";
        String result = SanitizationAspect.sanitizeRichText(input);
        assertTrue(result.contains("<ul>"));
        assertTrue(result.contains("<li>"));
    }

    @Test
    void stripAllHtml_shouldHandlePlainText() {
        String input = "Just plain text with no HTML";
        String result = SanitizationAspect.stripAllHtml(input);
        assertEquals(input, result);
    }
}
