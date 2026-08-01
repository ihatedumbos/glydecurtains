package com.glydecurtains.util;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class SlugGeneratorTest {

    private SlugGenerator slugGenerator;

    @BeforeEach
    void setUp() {
        slugGenerator = new SlugGenerator();
    }

    @Test
    void generate_shouldConvertToLowercase() {
        String result = slugGenerator.generate("Hello World");
        assertEquals("hello-world", result);
    }

    @Test
    void generate_shouldReplaceSpacesWithHyphens() {
        String result = slugGenerator.generate("my product name");
        assertEquals("my-product-name", result);
    }

    @Test
    void generate_shouldRemoveSpecialCharacters() {
        String result = slugGenerator.generate("Hello! @World# $2024");
        assertEquals("hello-world-2024", result);
    }

    @Test
    void generate_shouldHandleUnicodeCharacters() {
        String result = slugGenerator.generate("café über résumé");
        assertEquals("cafe-uber-resume", result);
    }

    @Test
    void generate_shouldCollapseMultipleHyphens() {
        String result = slugGenerator.generate("hello   ---   world");
        assertEquals("hello-world", result);
    }

    @Test
    void generate_shouldRemoveLeadingAndTrailingHyphens() {
        String result = slugGenerator.generate("  hello world  ");
        assertEquals("hello-world", result);
    }

    @Test
    void generate_shouldHandleNumbersInInput() {
        String result = slugGenerator.generate("Product 123 XL");
        assertEquals("product-123-xl", result);
    }

    @Test
    void generate_shouldThrowOnNullInput() {
        assertThrows(IllegalArgumentException.class, () -> slugGenerator.generate(null));
    }

    @Test
    void generate_shouldThrowOnBlankInput() {
        assertThrows(IllegalArgumentException.class, () -> slugGenerator.generate("   "));
    }

    @Test
    void generate_shouldHandleOnlySpecialCharacters() {
        String result = slugGenerator.generate("@#$%^&*");
        assertEquals("untitled", result);
    }

    @Test
    void generate_shouldTruncateLongInput() {
        String longInput = "a".repeat(300);
        String result = slugGenerator.generate(longInput);
        assertTrue(result.length() <= 200);
    }

    @Test
    void generate_shouldHandleHindiText() {
        // Hindi characters will be stripped (no Latin equivalent), fallback to "untitled"
        String result = slugGenerator.generate("पर्दे और सामान");
        assertEquals("untitled", result);
    }

    @Test
    void generate_shouldHandleMixedUnicodeAndAscii() {
        String result = slugGenerator.generate("Premium Curtains - été Collection");
        assertEquals("premium-curtains-ete-collection", result);
    }

    @Test
    void generateUnique_shouldReturnBaseSlugIfNotExists() {
        String result = slugGenerator.generateUnique("Hello World", slug -> false);
        assertEquals("hello-world", result);
    }

    @Test
    void generateUnique_shouldAppendSuffixIfExists() {
        Set<String> existing = new HashSet<>();
        existing.add("hello-world");

        String result = slugGenerator.generateUnique("Hello World", existing::contains);
        assertEquals("hello-world-1", result);
    }

    @Test
    void generateUnique_shouldIncrementSuffixUntilUnique() {
        Set<String> existing = new HashSet<>();
        existing.add("hello-world");
        existing.add("hello-world-1");
        existing.add("hello-world-2");

        String result = slugGenerator.generateUnique("Hello World", existing::contains);
        assertEquals("hello-world-3", result);
    }

    @Test
    void generateUnique_shouldWorkWithNullPredicate() {
        String result = slugGenerator.generateUnique("Hello World", null);
        assertEquals("hello-world", result);
    }

    @Test
    void generate_shouldHandleProductNames() {
        assertEquals("premium-silk-curtain-royal-blue", slugGenerator.generate("Premium Silk Curtain - Royal Blue"));
        assertEquals("aluminium-curtain-rod-6-meter", slugGenerator.generate("Aluminium Curtain Rod (6 Meter)"));
        assertEquals("heavy-duty-wall-brackets-set-of-4", slugGenerator.generate("Heavy Duty Wall Brackets - Set of 4"));
    }

    @Test
    void generate_shouldHandleAccentedCharacters() {
        assertEquals("creme-brulee", slugGenerator.generate("Crème Brûlée"));
        assertEquals("naive", slugGenerator.generate("naïve"));
        assertEquals("el-nino", slugGenerator.generate("El Niño"));
    }
}
