package com.glydecurtains.dto.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubCategoryUpdateRequest {

    @Size(max = 100, message = "Sub-category name must not exceed 100 characters")
    private String name;

    private Integer sortOrder;

    private Boolean isActive;
}
