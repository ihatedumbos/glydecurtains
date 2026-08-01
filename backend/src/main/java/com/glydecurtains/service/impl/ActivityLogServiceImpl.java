package com.glydecurtains.service.impl;

import com.glydecurtains.dto.response.ActivityLogResponse;
import com.glydecurtains.dto.response.PageResponse;
import com.glydecurtains.entity.ActivityLog;
import com.glydecurtains.repository.ActivityLogRepository;
import com.glydecurtains.service.ActivityLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Service
@RequiredArgsConstructor
public class ActivityLogServiceImpl implements ActivityLogService {

    private final ActivityLogRepository activityLogRepository;

    @Override
    @Transactional
    public void log(Long userId, String actionType, String entityType, Long entityId, String details, String ipAddress) {
        ActivityLog activityLog = ActivityLog.builder()
                .userId(userId)
                .actionType(actionType)
                .entityType(entityType)
                .entityId(entityId)
                .details(details)
                .ipAddress(ipAddress)
                .timestamp(LocalDateTime.now())
                .build();
        activityLogRepository.save(activityLog);
    }

    @Override
    @Transactional
    public void log(Long userId, String actionType, String entityType, Long entityId, String details) {
        log(userId, actionType, entityType, entityId, details, null);
    }

    @Override
    @Transactional
    public void log(Long userId, String actionType, String details) {
        log(userId, actionType, null, null, details, null);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ActivityLogResponse> getActivityLogs(
            String actionType,
            Long userId,
            LocalDate dateFrom,
            LocalDate dateTo,
            String entityType,
            Pageable pageable) {

        Specification<ActivityLog> spec = Specification.where(null);

        if (actionType != null && !actionType.isBlank()) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("actionType"), actionType));
        }

        if (userId != null) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("userId"), userId));
        }

        if (dateFrom != null) {
            LocalDateTime from = dateFrom.atStartOfDay();
            spec = spec.and((root, query, cb) ->
                    cb.greaterThanOrEqualTo(root.get("timestamp"), from));
        }

        if (dateTo != null) {
            LocalDateTime to = dateTo.atTime(LocalTime.MAX);
            spec = spec.and((root, query, cb) ->
                    cb.lessThanOrEqualTo(root.get("timestamp"), to));
        }

        if (entityType != null && !entityType.isBlank()) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("entityType"), entityType));
        }

        Page<ActivityLog> page = activityLogRepository.findAll(spec, pageable);
        return PageResponse.from(page.map(this::toResponse));
    }

    private ActivityLogResponse toResponse(ActivityLog log) {
        return ActivityLogResponse.builder()
                .id(log.getId())
                .userId(log.getUserId())
                .actionType(log.getActionType())
                .entityType(log.getEntityType())
                .entityId(log.getEntityId())
                .details(log.getDetails())
                .ipAddress(log.getIpAddress())
                .timestamp(log.getTimestamp())
                .build();
    }
}
