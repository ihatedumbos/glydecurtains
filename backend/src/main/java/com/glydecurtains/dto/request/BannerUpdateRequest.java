package com.glydecurtains.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BannerUpdateRequest {

    private String title;
    private String subtitle;
    private String imageBase64;
    private String buttonText;
    private String buttonLink;
    private Integer sortOrder;
    private Boolean isActive;

    /**
     * Multi-language translations. Key = language code, value = map of field → content.
     */
    private Map<String, Map<String, String>> translations;
}
