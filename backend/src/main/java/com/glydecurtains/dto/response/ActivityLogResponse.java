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
public class ActivityLogResponse {

    private Long id;
    private Long userId;
    private String actionType;
    private String entityType;
    private Long entityId;
    private String details;
    private String ipAddress;
    private LocalDateTime timestamp;
}
