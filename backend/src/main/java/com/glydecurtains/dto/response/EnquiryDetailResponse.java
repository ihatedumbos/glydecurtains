package com.glydecurtains.dto.response;

import com.glydecurtains.entity.enums.EnquiryStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EnquiryDetailResponse {

    private Long id;
    private String name;
    private String email;
    private String phone;
    private String subject;
    private String message;
    private EnquiryStatus status;
    private List<EnquiryReplyResponse> responses;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
