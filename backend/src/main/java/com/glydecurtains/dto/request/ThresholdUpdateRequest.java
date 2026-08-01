package com.glydecurtains.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ThresholdUpdateRequest {

    @NotNull(message = "Threshold value is required")
    @Min(value = 0, message = "Threshold must be non-negative")
    private Integer threshold;
}
