package com.glydecurtains.dto.request;

import com.glydecurtains.entity.enums.PageType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StaticPageUpdateRequest {

    private String title;
    private String slug;
    private String content;
    private PageType pageType;
    private Boolean isVisible;

    /**
     * Multi-language translations. Key = language code, value = map of field → content.
     */
    private Map<String, Map<String, String>> translations;
}
