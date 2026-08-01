package com.glydecurtains.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PermissionUpdateRequest {

    @NotBlank(message = "Entity is required")
    private String entity;

    @NotBlank(message = "Operation is required")
    private String operation;

    @NotNull(message = "Granted flag is required")
    private Boolean granted;
}
