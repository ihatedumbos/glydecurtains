package com.glydecurtains.service;

import com.glydecurtains.entity.TranslatedContent;
import com.glydecurtains.repository.TranslatedContentRepository;
import com.glydecurtains.service.impl.TranslationServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TranslationServiceTest {

    @Mock
    private TranslatedContentRepository translatedContentRepository;

    @InjectMocks
    private TranslationServiceImpl translationService;

    private static final String ENTITY_TYPE = "product";
    private static final Long ENTITY_ID = 1L;
    private static final String FIELD_NAME = "name";
    private static final String LANGUAGE_EN = "en";
    private static final String LANGUAGE_HI = "hi";
    private static final String LANGUAGE_GU = "gu";

    private TranslatedContent englishContent;
    private TranslatedContent hindiContent;

    @BeforeEach
    void setUp() {
        englishContent = new TranslatedContent(ENTITY_TYPE, ENTITY_ID, FIELD_NAME, LANGUAGE_EN, "Premium Curtain");
        englishContent.setId(1L);

        hindiContent = new TranslatedContent(ENTITY_TYPE, ENTITY_ID, FIELD_NAME, LANGUAGE_HI, "प्रीमियम पर्दा");
        hindiContent.setId(2L);
    }

    @Nested
    @DisplayName("getTranslatedFields - get translations by locale")
    class GetTranslatedFields {

        @Test
        @DisplayName("should return translations in requested language with English fallback")
        void shouldReturnTranslationsInRequestedLanguage() {
            TranslatedContent enName = new TranslatedContent(ENTITY_TYPE, ENTITY_ID, "name", LANGUAGE_EN, "Premium Curtain");
            TranslatedContent enDesc = new TranslatedContent(ENTITY_TYPE, ENTITY_ID, "description", LANGUAGE_EN, "A fine curtain");
            TranslatedContent hiName = new TranslatedContent(ENTITY_TYPE, ENTITY_ID, "name", LANGUAGE_HI, "प्रीमियम पर्दा");

            when(translatedContentRepository.findByEntityTypeAndEntityIdAndLanguage(ENTITY_TYPE, ENTITY_ID, LANGUAGE_EN))
                    .thenReturn(List.of(enName, enDesc));
            when(translatedContentRepository.findByEntityTypeAndEntityIdAndLanguage(ENTITY_TYPE, ENTITY_ID, LANGUAGE_HI))
                    .thenReturn(List.of(hiName));

            Map<String, String> result = translationService.getTranslatedFields(ENTITY_TYPE, ENTITY_ID, LANGUAGE_HI);

            assertThat(result).hasSize(2);
            assertThat(result.get("name")).isEqualTo("प्रीमियम पर्दा");
            assertThat(result.get("description")).isEqualTo("A fine curtain");
        }

        @Test
        @DisplayName("should return only English translations when English is requested")
        void shouldReturnEnglishWhenEnglishRequested() {
            TranslatedContent enName = new TranslatedContent(ENTITY_TYPE, ENTITY_ID, "name", LANGUAGE_EN, "Premium Curtain");

            when(translatedContentRepository.findByEntityTypeAndEntityIdAndLanguage(ENTITY_TYPE, ENTITY_ID, LANGUAGE_EN))
                    .thenReturn(List.of(enName));

            Map<String, String> result = translationService.getTranslatedFields(ENTITY_TYPE, ENTITY_ID, LANGUAGE_EN);

            assertThat(result).hasSize(1);
            assertThat(result.get("name")).isEqualTo("Premium Curtain");
            verify(translatedContentRepository, times(1))
                    .findByEntityTypeAndEntityIdAndLanguage(ENTITY_TYPE, ENTITY_ID, LANGUAGE_EN);
        }

        @Test
        @DisplayName("should return empty map when no translations exist")
        void shouldReturnEmptyMapWhenNoTranslations() {
            when(translatedContentRepository.findByEntityTypeAndEntityIdAndLanguage(ENTITY_TYPE, ENTITY_ID, LANGUAGE_EN))
                    .thenReturn(Collections.emptyList());

            Map<String, String> result = translationService.getTranslatedFields(ENTITY_TYPE, ENTITY_ID, LANGUAGE_EN);

            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("should fall back to English when requested language has no translations")
        void shouldFallBackToEnglishWhenNoRequestedLanguage() {
            TranslatedContent enName = new TranslatedContent(ENTITY_TYPE, ENTITY_ID, "name", LANGUAGE_EN, "Premium Curtain");

            when(translatedContentRepository.findByEntityTypeAndEntityIdAndLanguage(ENTITY_TYPE, ENTITY_ID, LANGUAGE_EN))
                    .thenReturn(List.of(enName));
            when(translatedContentRepository.findByEntityTypeAndEntityIdAndLanguage(ENTITY_TYPE, ENTITY_ID, LANGUAGE_GU))
                    .thenReturn(Collections.emptyList());

            Map<String, String> result = translationService.getTranslatedFields(ENTITY_TYPE, ENTITY_ID, LANGUAGE_GU);

            assertThat(result).hasSize(1);
            assertThat(result.get("name")).isEqualTo("Premium Curtain");
        }
    }

    @Nested
    @DisplayName("getTranslatedField - get single translated field with fallback")
    class GetTranslatedField {

        @Test
        @DisplayName("should return translation in requested language")
        void shouldReturnTranslationInRequestedLanguage() {
            when(translatedContentRepository.findByEntityTypeAndEntityIdAndFieldNameAndLanguage(
                    ENTITY_TYPE, ENTITY_ID, FIELD_NAME, LANGUAGE_HI))
                    .thenReturn(Optional.of(hindiContent));

            String result = translationService.getTranslatedField(ENTITY_TYPE, ENTITY_ID, FIELD_NAME, LANGUAGE_HI);

            assertThat(result).isEqualTo("प्रीमियम पर्दा");
        }

        @Test
        @DisplayName("should fall back to English when requested language not found")
        void shouldFallBackToEnglish() {
            when(translatedContentRepository.findByEntityTypeAndEntityIdAndFieldNameAndLanguage(
                    ENTITY_TYPE, ENTITY_ID, FIELD_NAME, LANGUAGE_GU))
                    .thenReturn(Optional.empty());
            when(translatedContentRepository.findByEntityTypeAndEntityIdAndFieldNameAndLanguage(
                    ENTITY_TYPE, ENTITY_ID, FIELD_NAME, LANGUAGE_EN))
                    .thenReturn(Optional.of(englishContent));

            String result = translationService.getTranslatedField(ENTITY_TYPE, ENTITY_ID, FIELD_NAME, LANGUAGE_GU);

            assertThat(result).isEqualTo("Premium Curtain");
        }

        @Test
        @DisplayName("should return null when no translation exists in any language")
        void shouldReturnNullWhenNoTranslation() {
            when(translatedContentRepository.findByEntityTypeAndEntityIdAndFieldNameAndLanguage(
                    ENTITY_TYPE, ENTITY_ID, FIELD_NAME, LANGUAGE_HI))
                    .thenReturn(Optional.empty());
            when(translatedContentRepository.findByEntityTypeAndEntityIdAndFieldNameAndLanguage(
                    ENTITY_TYPE, ENTITY_ID, FIELD_NAME, LANGUAGE_EN))
                    .thenReturn(Optional.empty());

            String result = translationService.getTranslatedField(ENTITY_TYPE, ENTITY_ID, FIELD_NAME, LANGUAGE_HI);

            assertThat(result).isNull();
        }

        @Test
        @DisplayName("should return English directly when English is the requested language")
        void shouldReturnEnglishDirectly() {
            when(translatedContentRepository.findByEntityTypeAndEntityIdAndFieldNameAndLanguage(
                    ENTITY_TYPE, ENTITY_ID, FIELD_NAME, LANGUAGE_EN))
                    .thenReturn(Optional.of(englishContent));

            String result = translationService.getTranslatedField(ENTITY_TYPE, ENTITY_ID, FIELD_NAME, LANGUAGE_EN);

            assertThat(result).isEqualTo("Premium Curtain");
        }
    }

    @Nested
    @DisplayName("saveTranslation - create or update translation")
    class SaveTranslation {

        @Test
        @DisplayName("should create new translation when none exists")
        void shouldCreateNewTranslation() {
            when(translatedContentRepository.findByEntityTypeAndEntityIdAndFieldNameAndLanguage(
                    ENTITY_TYPE, ENTITY_ID, FIELD_NAME, LANGUAGE_HI))
                    .thenReturn(Optional.empty());
            when(translatedContentRepository.save(any(TranslatedContent.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            translationService.saveTranslation(ENTITY_TYPE, ENTITY_ID, FIELD_NAME, LANGUAGE_HI, "प्रीमियम पर्दा");

            ArgumentCaptor<TranslatedContent> captor = ArgumentCaptor.forClass(TranslatedContent.class);
            verify(translatedContentRepository).save(captor.capture());

            TranslatedContent saved = captor.getValue();
            assertThat(saved.getEntityType()).isEqualTo(ENTITY_TYPE);
            assertThat(saved.getEntityId()).isEqualTo(ENTITY_ID);
            assertThat(saved.getFieldName()).isEqualTo(FIELD_NAME);
            assertThat(saved.getLanguage()).isEqualTo(LANGUAGE_HI);
            assertThat(saved.getContent()).isEqualTo("प्रीमियम पर्दा");
        }

        @Test
        @DisplayName("should update existing translation")
        void shouldUpdateExistingTranslation() {
            TranslatedContent existing = new TranslatedContent(ENTITY_TYPE, ENTITY_ID, FIELD_NAME, LANGUAGE_HI, "Old Translation");
            existing.setId(5L);

            when(translatedContentRepository.findByEntityTypeAndEntityIdAndFieldNameAndLanguage(
                    ENTITY_TYPE, ENTITY_ID, FIELD_NAME, LANGUAGE_HI))
                    .thenReturn(Optional.of(existing));
            when(translatedContentRepository.save(any(TranslatedContent.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            translationService.saveTranslation(ENTITY_TYPE, ENTITY_ID, FIELD_NAME, LANGUAGE_HI, "Updated Translation");

            ArgumentCaptor<TranslatedContent> captor = ArgumentCaptor.forClass(TranslatedContent.class);
            verify(translatedContentRepository).save(captor.capture());

            TranslatedContent saved = captor.getValue();
            assertThat(saved.getId()).isEqualTo(5L);
            assertThat(saved.getContent()).isEqualTo("Updated Translation");
        }
    }

    @Nested
    @DisplayName("saveTranslations - bulk create/update translations")
    class SaveTranslations {

        @Test
        @DisplayName("should save multiple translations for an entity")
        void shouldSaveMultipleTranslations() {
            Map<String, String> translations = Map.of(
                    "name", "प्रीमियम पर्दा",
                    "description", "एक शानदार पर्दा"
            );

            when(translatedContentRepository.findByEntityTypeAndEntityIdAndFieldNameAndLanguage(
                    eq(ENTITY_TYPE), eq(ENTITY_ID), anyString(), eq(LANGUAGE_HI)))
                    .thenReturn(Optional.empty());
            when(translatedContentRepository.save(any(TranslatedContent.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            translationService.saveTranslations(ENTITY_TYPE, ENTITY_ID, LANGUAGE_HI, translations);

            verify(translatedContentRepository, times(2)).save(any(TranslatedContent.class));
        }

        @Test
        @DisplayName("should skip null or blank values")
        void shouldSkipNullOrBlankValues() {
            Map<String, String> translations = Map.of(
                    "name", "Valid Translation",
                    "description", "   "
            );

            when(translatedContentRepository.findByEntityTypeAndEntityIdAndFieldNameAndLanguage(
                    eq(ENTITY_TYPE), eq(ENTITY_ID), eq("name"), eq(LANGUAGE_HI)))
                    .thenReturn(Optional.empty());
            when(translatedContentRepository.save(any(TranslatedContent.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            translationService.saveTranslations(ENTITY_TYPE, ENTITY_ID, LANGUAGE_HI, translations);

            verify(translatedContentRepository, times(1)).save(any(TranslatedContent.class));
        }

        @Test
        @DisplayName("should handle empty translations map gracefully")
        void shouldHandleEmptyMap() {
            translationService.saveTranslations(ENTITY_TYPE, ENTITY_ID, LANGUAGE_HI, Collections.emptyMap());

            verify(translatedContentRepository, never()).save(any(TranslatedContent.class));
        }

        @Test
        @DisplayName("should handle null translations map gracefully")
        void shouldHandleNullMap() {
            translationService.saveTranslations(ENTITY_TYPE, ENTITY_ID, LANGUAGE_HI, null);

            verify(translatedContentRepository, never()).save(any(TranslatedContent.class));
        }
    }

    @Nested
    @DisplayName("getAllTranslations - get all translations for entity")
    class GetAllTranslations {

        @Test
        @DisplayName("should return all translations grouped by language")
        void shouldReturnAllTranslationsGroupedByLanguage() {
            TranslatedContent enName = new TranslatedContent(ENTITY_TYPE, ENTITY_ID, "name", LANGUAGE_EN, "Premium Curtain");
            TranslatedContent enDesc = new TranslatedContent(ENTITY_TYPE, ENTITY_ID, "description", LANGUAGE_EN, "A fine curtain");
            TranslatedContent hiName = new TranslatedContent(ENTITY_TYPE, ENTITY_ID, "name", LANGUAGE_HI, "प्रीमियम पर्दा");

            when(translatedContentRepository.findByEntityTypeAndEntityId(ENTITY_TYPE, ENTITY_ID))
                    .thenReturn(List.of(enName, enDesc, hiName));

            Map<String, Map<String, String>> result = translationService.getAllTranslations(ENTITY_TYPE, ENTITY_ID);

            assertThat(result).hasSize(2);
            assertThat(result.get(LANGUAGE_EN)).containsEntry("name", "Premium Curtain");
            assertThat(result.get(LANGUAGE_EN)).containsEntry("description", "A fine curtain");
            assertThat(result.get(LANGUAGE_HI)).containsEntry("name", "प्रीमियम पर्दा");
        }

        @Test
        @DisplayName("should return empty map when no translations exist")
        void shouldReturnEmptyMapWhenNoTranslations() {
            when(translatedContentRepository.findByEntityTypeAndEntityId(ENTITY_TYPE, ENTITY_ID))
                    .thenReturn(Collections.emptyList());

            Map<String, Map<String, String>> result = translationService.getAllTranslations(ENTITY_TYPE, ENTITY_ID);

            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("deleteTranslations - remove translations for entity")
    class DeleteTranslations {

        @Test
        @DisplayName("should delete all translations for an entity")
        void shouldDeleteAllTranslationsForEntity() {
            translationService.deleteTranslations(ENTITY_TYPE, ENTITY_ID);

            verify(translatedContentRepository).deleteByEntityTypeAndEntityId(ENTITY_TYPE, ENTITY_ID);
        }

        @Test
        @DisplayName("should delete translations for specific entity and language")
        void shouldDeleteTranslationsForEntityAndLanguage() {
            translationService.deleteTranslations(ENTITY_TYPE, ENTITY_ID, LANGUAGE_HI);

            verify(translatedContentRepository).deleteByEntityTypeAndEntityIdAndLanguage(ENTITY_TYPE, ENTITY_ID, LANGUAGE_HI);
        }
    }
}
