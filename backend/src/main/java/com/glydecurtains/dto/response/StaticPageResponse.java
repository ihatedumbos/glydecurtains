package com.glydecurtains.dto.response;

import com.glydecurtains.entity.enums.PageType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StaticPageResponse {

    private Long id;
    private String title;
    private String slug;
    private String content;
    private PageType pageType;
    private Boolean isVisible;
    private LocalDateTime versionTimestamp;
    private Map<String, Map<String, String>> translations;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
