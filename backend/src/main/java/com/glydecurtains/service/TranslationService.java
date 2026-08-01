package com.glydecurtains.service;

import java.util.List;
import java.util.Map;

public interface TranslationService {

    /**
     * Store or update a translation for a specific entity field.
     */
    void saveTranslation(String entityType, Long entityId, String fieldName, String language, String content);

    /**
     * Store or update multiple translations for a specific entity and language.
     * Map key = fieldName, value = translated content.
     */
    void saveTranslations(String entityType, Long entityId, String language, Map<String, String> translations);

    /**
     * Get a translated field value for a specific entity.
     * Fallback logic: requested language → English ("en") → null.
     */
    String getTranslatedField(String entityType, Long entityId, String fieldName, String language);

    /**
     * Get all translated fields for a specific entity and language.
     * Applies fallback: requested language → English ("en").
     * Returns map of fieldName → content.
     */
    Map<String, String> getTranslatedFields(String entityType, Long entityId, String language);

    /**
     * Get all translations for a specific entity (all languages).
     * Returns map of language → (fieldName → content).
     */
    Map<String, Map<String, String>> getAllTranslations(String entityType, Long entityId);

    /**
     * Delete all translations for a specific entity.
     */
    void deleteTranslations(String entityType, Long entityId);

    /**
     * Delete translations for a specific entity and language.
     */
    void deleteTranslations(String entityType, Long entityId, String language);
}
