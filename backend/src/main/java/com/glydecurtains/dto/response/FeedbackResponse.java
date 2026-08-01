package com.glydecurtains.dto.response;

import com.glydecurtains.entity.enums.FeedbackStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackResponse {

    private Long id;
    private Long userId;
    private String userName;
    private Long productId;
    private String productName;
    private Integer rating;
    private String title;
    private String comment;
    private FeedbackStatus status;
    private String adminReply;
    private Long repliedById;
    private String repliedByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
