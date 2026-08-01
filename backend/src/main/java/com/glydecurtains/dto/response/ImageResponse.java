package com.glydecurtains.dto.response;

import com.glydecurtains.entity.enums.MediaType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImageResponse {

    private Long id;
    private String mimeType;
    private MediaType mediaType;
    private Integer duration;
    private String originalFilename;
    private Integer width;
    private Integer height;
    private String entityType;
    private Long entityId;
    private LocalDateTime uploadedAt;
}
