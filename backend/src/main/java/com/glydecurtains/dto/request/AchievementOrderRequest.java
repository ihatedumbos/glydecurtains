package com.glydecurtains.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AchievementOrderRequest {

    @NotNull(message = "Achievement ID is required")
    private Long id;

    @NotNull(message = "Sort order is required")
    private Integer sortOrder;
}
