package com.glydecurtains.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ThemeConfigUpdateRequest {

    @NotBlank(message = "Theme config JSON is required")
    private String config;
}
