package com.glydecurtains.dto.request;

import com.glydecurtains.entity.enums.FeedbackStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackFilterRequest {

    private FeedbackStatus status;
    private Long productId;
}
