package com.glydecurtains.service.impl;

import com.glydecurtains.entity.TranslatedContent;
import com.glydecurtains.repository.TranslatedContentRepository;
import com.glydecurtains.service.TranslationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class TranslationServiceImpl implements TranslationService {

    private static final String DEFAULT_LANGUAGE = "en";

    private final TranslatedContentRepository translatedContentRepository;

    @Override
    public void saveTranslation(String entityType, Long entityId, String fieldName, String language, String content) {
        Optional<TranslatedContent> existing = translatedContentRepository
                .findByEntityTypeAndEntityIdAndFieldNameAndLanguage(entityType, entityId, fieldName, language);

        if (existing.isPresent()) {
            TranslatedContent tc = existing.get();
            tc.setContent(content);
            translatedContentRepository.save(tc);
        } else {
            TranslatedContent tc = new TranslatedContent(entityType, entityId, fieldName, language, content);
            translatedContentRepository.save(tc);
        }
    }

    @Override
    public void saveTranslations(String entityType, Long entityId, String language, Map<String, String> translations) {
        if (translations == null || translations.isEmpty()) {
            return;
        }
        for (Map.Entry<String, String> entry : translations.entrySet()) {
            if (entry.getValue() != null && !entry.getValue().isBlank()) {
                saveTranslation(entityType, entityId, entry.getKey(), language, entry.getValue());
            }
        }
    }

    @Override
    @Transactional(readOnly = true)
    public String getTranslatedField(String entityType, Long entityId, String fieldName, String language) {
        // Try requested language first
        if (language != null && !language.equalsIgnoreCase(DEFAULT_LANGUAGE)) {
            Optional<TranslatedContent> translation = translatedContentRepository
                    .findByEntityTypeAndEntityIdAndFieldNameAndLanguage(entityType, entityId, fieldName, language);
            if (translation.isPresent()) {
                return translation.get().getContent();
            }
        }

        // Fallback to English
        Optional<TranslatedContent> englishTranslation = translatedContentRepository
                .findByEntityTypeAndEntityIdAndFieldNameAndLanguage(entityType, entityId, fieldName, DEFAULT_LANGUAGE);
        return englishTranslation.map(TranslatedContent::getContent).orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, String> getTranslatedFields(String entityType, Long entityId, String language) {
        Map<String, String> result = new HashMap<>();

        // Load English as base (fallback)
        List<TranslatedContent> englishContent = translatedContentRepository
                .findByEntityTypeAndEntityIdAndLanguage(entityType, entityId, DEFAULT_LANGUAGE);
        for (TranslatedContent tc : englishContent) {
            result.put(tc.getFieldName(), tc.getContent());
        }

        // Override with requested language if different from English
        if (language != null && !language.equalsIgnoreCase(DEFAULT_LANGUAGE)) {
            List<TranslatedContent> requestedContent = translatedContentRepository
                    .findByEntityTypeAndEntityIdAndLanguage(entityType, entityId, language);
            for (TranslatedContent tc : requestedContent) {
                result.put(tc.getFieldName(), tc.getContent());
            }
        }

        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Map<String, String>> getAllTranslations(String entityType, Long entityId) {
        List<TranslatedContent> allContent = translatedContentRepository
                .findByEntityTypeAndEntityId(entityType, entityId);

        return allContent.stream()
                .collect(Collectors.groupingBy(
                        TranslatedContent::getLanguage,
                        Collectors.toMap(TranslatedContent::getFieldName, TranslatedContent::getContent)
                ));
    }

    @Override
    public void deleteTranslations(String entityType, Long entityId) {
        translatedContentRepository.deleteByEntityTypeAndEntityId(entityType, entityId);
    }

    @Override
    public void deleteTranslations(String entityType, Long entityId, String language) {
        translatedContentRepository.deleteByEntityTypeAndEntityIdAndLanguage(entityType, entityId, language);
    }
}
