package com.glydecurtains.service;

import com.glydecurtains.dto.response.ActivityLogResponse;
import com.glydecurtains.dto.response.PageResponse;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;

public interface ActivityLogService {

    void log(Long userId, String actionType, String entityType, Long entityId, String details, String ipAddress);

    void log(Long userId, String actionType, String entityType, Long entityId, String details);

    void log(Long userId, String actionType, String details);

    PageResponse<ActivityLogResponse> getActivityLogs(
            String actionType,
            Long userId,
            LocalDate dateFrom,
            LocalDate dateTo,
            String entityType,
            Pageable pageable);
}
