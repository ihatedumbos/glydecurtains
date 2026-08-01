package com.glydecurtains.dto.request;

import com.glydecurtains.entity.enums.PageType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StaticPageCreateRequest {

    @NotBlank
    private String title;

    private String slug;

    private String content;

    @NotNull
    private PageType pageType;

    private Boolean isVisible;

    /**
     * Multi-language translations. Key = language code, value = map of field → content.
     */
    private Map<String, Map<String, String>> translations;
}
