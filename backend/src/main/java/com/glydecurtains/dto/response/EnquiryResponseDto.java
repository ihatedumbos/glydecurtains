package com.glydecurtains.dto.response;

import com.glydecurtains.entity.enums.EnquiryStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnquiryResponseDto {

    private Long id;
    private String name;
    private String email;
    private String phone;
    private String subject;
    private String message;
    private EnquiryStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
