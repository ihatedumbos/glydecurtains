package com.glydecurtains.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SectionOrderRequest {

    @NotNull
    private Long id;

    @NotNull
    private Integer sortOrder;
}
