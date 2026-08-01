package com.glydecurtains.repository;

import com.glydecurtains.entity.TranslatedContent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TranslatedContentRepository extends JpaRepository<TranslatedContent, Long> {

    List<TranslatedContent> findByEntityTypeAndEntityIdAndLanguage(String entityType, Long entityId, String language);

    Optional<TranslatedContent> findByEntityTypeAndEntityIdAndFieldNameAndLanguage(
            String entityType, Long entityId, String fieldName, String language);

    List<TranslatedContent> findByEntityTypeAndEntityId(String entityType, Long entityId);

    void deleteByEntityTypeAndEntityId(String entityType, Long entityId);

    void deleteByEntityTypeAndEntityIdAndLanguage(String entityType, Long entityId, String language);
}
