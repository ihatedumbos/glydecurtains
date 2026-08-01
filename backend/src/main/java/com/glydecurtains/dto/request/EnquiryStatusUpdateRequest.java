package com.glydecurtains.dto.request;

import com.glydecurtains.entity.enums.EnquiryStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EnquiryStatusUpdateRequest {

    @NotNull(message = "Status is required")
    private EnquiryStatus status;
}
