package com.glydecurtains.dto.response;

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
public class BannerResponse {

    private Long id;
    private Long sectionId;
    private String title;
    private String subtitle;
    private String imageBase64;
    private String buttonText;
    private String buttonLink;
    private Integer sortOrder;
    private Boolean isActive;
    private Map<String, Map<String, String>> translations;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
