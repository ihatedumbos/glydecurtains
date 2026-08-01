package com.glydecurtains.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "translated_content", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"entity_type", "entity_id", "field_name", "language"})
})
@Getter
@Setter
@NoArgsConstructor
public class TranslatedContent extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType;

    @NotNull
    @Column(name = "entity_id", nullable = false)
    private Long entityId;

    @NotBlank
    @Column(name = "field_name", nullable = false, length = 100)
    private String fieldName;

    @NotBlank
    @Column(name = "language", nullable = false, length = 10)
    private String language;

    @NotBlank
    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    public TranslatedContent(String entityType, Long entityId, String fieldName, String language, String content) {
        this.entityType = entityType;
        this.entityId = entityId;
        this.fieldName = fieldName;
        this.language = language;
        this.content = content;
    }
}
