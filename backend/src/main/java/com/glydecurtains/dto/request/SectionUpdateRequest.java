package com.glydecurtains.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SectionUpdateRequest {

    private String title;
    private Boolean isEnabled;
    private Integer sortOrder;
    private String config;

    /**
     * Multi-language translations. Key = language code (e.g., "hi", "gu"), value = map of field → content.
     */
    private Map<String, Map<String, String>> translations;
}
