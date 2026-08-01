package com.glydecurtains.dto.request;

import com.glydecurtains.entity.enums.MetricFormat;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AchievementUpdateRequest {

    @Size(max = 100, message = "Title must not exceed 100 characters")
    private String title;

    @Size(max = 500, message = "Description must not exceed 500 characters")
    private String description;

    private String iconBase64;

    @Min(value = 1900, message = "Year must be 1900 or later")
    private Integer year;

    private String metricValue;

    private MetricFormat metricFormat;

    private Integer sortOrder;

    private Boolean isEnabled;
}
