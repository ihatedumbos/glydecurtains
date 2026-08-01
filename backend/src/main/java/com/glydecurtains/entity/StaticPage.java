package com.glydecurtains.entity;

import com.glydecurtains.entity.enums.PageType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "static_pages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class StaticPage extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "slug", nullable = false, unique = true)
    private String slug;

    @Lob
    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(name = "page_type", nullable = false)
    private PageType pageType;

    @Column(name = "is_visible", nullable = false)
    private Boolean isVisible = true;

    @Column(name = "version_timestamp")
    private LocalDateTime versionTimestamp;

    @PrePersist
    @Override
    protected void onCreate() {
        super.onCreate();
        this.versionTimestamp = LocalDateTime.now();
    }

    @PreUpdate
    @Override
    protected void onUpdate() {
        super.onUpdate();
        this.versionTimestamp = LocalDateTime.now();
    }
}
