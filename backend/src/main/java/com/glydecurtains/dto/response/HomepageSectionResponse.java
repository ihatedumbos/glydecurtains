package com.glydecurtains.dto.response;

import com.glydecurtains.entity.enums.SectionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HomepageSectionResponse {

    private Long id;
    private SectionType sectionType;
    private String title;
    private Boolean isEnabled;
    private Integer sortOrder;
    private String config;
    private List<BannerResponse> banners;
    private Map<String, Map<String, String>> translations;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
