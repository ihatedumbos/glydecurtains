package com.glydecurtains.dto.response;

import com.glydecurtains.entity.enums.MediaType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImageDataResponse {

    private Long id;
    private String base64Data;
    private String mimeType;
    private MediaType mediaType;
    private Integer duration;
    private String originalFilename;
    private Integer width;
    private Integer height;
}
