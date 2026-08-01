package com.glydecurtains.dto.response;

import com.glydecurtains.entity.enums.MetricFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AchievementResponse {

    private Long id;
    private String title;
    private String description;
    private String iconBase64;
    private Integer year;
    private String metricValue;
    private MetricFormat metricFormat;
    private Integer sortOrder;
    private Boolean isEnabled;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
