package com.glydecurtains.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BannerCreateRequest {

    @NotNull
    private Long sectionId;

    private String title;
    private String subtitle;

    @NotNull
    private String imageBase64;

    private String buttonText;
    private String buttonLink;
    private Integer sortOrder;

    /**
     * Multi-language translations. Key = language code, value = map of field → content.
     */
    private Map<String, Map<String, String>> translations;
}
