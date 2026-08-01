package com.glydecurtains.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryTreeResponse {

    private Long id;
    private String name;
    private String description;
    private String iconBase64;
    private String imageBase64;
    private Integer sortOrder;
    private Boolean isVisible;
    private Boolean isActive;
    private List<SubCategoryResponse> subCategories;
}
