package com.glydecurtains.util;

import org.springframework.stereotype.Component;

import java.text.Normalizer;
import java.util.function.Predicate;
import java.util.regex.Pattern;

/**
 * Utility for generating URL-friendly slugs from titles/names.
 * Handles Unicode characters, ensures uniqueness via a predicate check,
 * and produces lowercase, hyphen-separated strings.
 */
@Component
public class SlugGenerator {

    private static final Pattern NON_ALPHANUMERIC = Pattern.compile("[^a-z0-9\\-]");
    private static final Pattern MULTIPLE_HYPHENS = Pattern.compile("-{2,}");
    private static final Pattern LEADING_TRAILING_HYPHENS = Pattern.compile("^-+|-+$");
    private static final int MAX_SLUG_LENGTH = 200;

    /**
     * Generates a URL-friendly slug from the given input text.
     * Converts to lowercase, replaces spaces with hyphens, removes special characters,
     * and normalizes Unicode characters.
     *
     * @param input the text to convert to a slug
     * @return the generated slug
     * @throws IllegalArgumentException if input is null or blank
     */
    public String generate(String input) {
        if (input == null || input.isBlank()) {
            throw new IllegalArgumentException("Input text for slug generation cannot be null or blank");
        }

        String slug = normalizeUnicode(input);
        slug = slug.toLowerCase();
        slug = slug.replace(' ', '-');
        slug = NON_ALPHANUMERIC.matcher(slug).replaceAll("");
        slug = MULTIPLE_HYPHENS.matcher(slug).replaceAll("-");
        slug = LEADING_TRAILING_HYPHENS.matcher(slug).replaceAll("");

        // Truncate if too long
        if (slug.length() > MAX_SLUG_LENGTH) {
            slug = slug.substring(0, MAX_SLUG_LENGTH);
            // Remove trailing hyphen after truncation
            slug = LEADING_TRAILING_HYPHENS.matcher(slug).replaceAll("");
        }

        if (slug.isEmpty()) {
            slug = "untitled";
        }

        return slug;
    }

    /**
     * Generates a unique slug by appending a numeric suffix if the slug already exists.
     * Uses the provided predicate to check for existing slugs.
     *
     * @param input      the text to convert to a slug
     * @param existsCheck a predicate that returns true if the slug already exists
     * @return a unique slug
     * @throws IllegalArgumentException if input is null or blank
     */
    public String generateUnique(String input, Predicate<String> existsCheck) {
        if (existsCheck == null) {
            return generate(input);
        }

        String baseSlug = generate(input);

        if (!existsCheck.test(baseSlug)) {
            return baseSlug;
        }

        // Append numeric suffix to ensure uniqueness
        int suffix = 1;
        String candidateSlug;
        do {
            candidateSlug = baseSlug + "-" + suffix;
            suffix++;
        } while (existsCheck.test(candidateSlug));

        return candidateSlug;
    }

    /**
     * Normalizes Unicode characters by decomposing them and stripping diacritical marks.
     * For example, "café" becomes "cafe", "über" becomes "uber".
     */
    private String normalizeUnicode(String input) {
        // Normalize to NFD (decomposed form) then strip diacritical marks
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD);
        // Remove combining diacritical marks (Unicode category Mn)
        normalized = normalized.replaceAll("\\p{Mn}", "");
        return normalized;
    }
}
