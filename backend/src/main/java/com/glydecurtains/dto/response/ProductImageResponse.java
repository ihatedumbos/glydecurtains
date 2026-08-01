package com.glydecurtains.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductImageResponse {

    private Long id;
    private String base64Data;
    private String mimeType;
    private String mediaType;
    private String originalFilename;
    private Integer width;
    private Integer height;
    private Boolean isThumbnail;
    private Integer sortOrder;
    private LocalDateTime uploadedAt;
}
