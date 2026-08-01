package com.glydecurtains.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubCategoryCreateRequest {

    @NotBlank(message = "Sub-category name is required")
    @Size(max = 100, message = "Sub-category name must not exceed 100 characters")
    private String name;

    private Integer sortOrder;
}
