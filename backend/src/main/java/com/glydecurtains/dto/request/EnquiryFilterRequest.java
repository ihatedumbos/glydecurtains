package com.glydecurtains.dto.request;

import com.glydecurtains.entity.enums.EnquiryStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EnquiryFilterRequest {

    private EnquiryStatus status;
    private String search;
}
