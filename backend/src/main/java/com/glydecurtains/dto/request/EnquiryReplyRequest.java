package com.glydecurtains.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EnquiryReplyRequest {

    @NotBlank(message = "Reply message is required")
    @Size(max = 5000, message = "Reply message must not exceed 5000 characters")
    private String message;
}
