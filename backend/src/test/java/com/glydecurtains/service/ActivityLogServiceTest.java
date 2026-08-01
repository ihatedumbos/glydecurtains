package com.glydecurtains.service;

import com.glydecurtains.dto.response.ActivityLogResponse;
import com.glydecurtains.dto.response.PageResponse;
import com.glydecurtains.entity.ActivityLog;
import com.glydecurtains.repository.ActivityLogRepository;
import com.glydecurtains.service.impl.ActivityLogServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ActivityLogServiceTest {

    @Mock
    private ActivityLogRepository activityLogRepository;

    @InjectMocks
    private ActivityLogServiceImpl activityLogService;

    private static final Long USER_ID = 1L;
    private static final Long ENTITY_ID = 42L;
    private static final String ACTION_TYPE = "CREATE";
    private static final String ENTITY_TYPE = "PRODUCT";
    private static final String DETAILS = "{\"name\": \"Premium Curtain\"}";
    private static final String IP_ADDRESS = "192.168.1.100";

    private ActivityLog sampleLog;

    @BeforeEach
    void setUp() {
        sampleLog = ActivityLog.builder()
                .id(1L)
                .userId(USER_ID)
                .actionType(ACTION_TYPE)
                .entityType(ENTITY_TYPE)
                .entityId(ENTITY_ID)
                .details(DETAILS)
                .ipAddress(IP_ADDRESS)
                .timestamp(LocalDateTime.of(2024, 6, 15, 10, 30, 0))
                .build();
    }

    @Nested
    @DisplayName("log activity")
    class LogActivity {

        @Test
        @DisplayName("should create and persist activity log with all fields")
        void shouldLogActivityWithAllFields() {
            when(activityLogRepository.save(any(ActivityLog.class))).thenReturn(sampleLog);

            activityLogService.log(USER_ID, ACTION_TYPE, ENTITY_TYPE, ENTITY_ID, DETAILS, IP_ADDRESS);

            ArgumentCaptor<ActivityLog> captor = ArgumentCaptor.forClass(ActivityLog.class);
            verify(activityLogRepository).save(captor.capture());

            ActivityLog saved = captor.getValue();
            assertThat(saved.getUserId()).isEqualTo(USER_ID);
            assertThat(saved.getActionType()).isEqualTo(ACTION_TYPE);
            assertThat(saved.getEntityType()).isEqualTo(ENTITY_TYPE);
            assertThat(saved.getEntityId()).isEqualTo(ENTITY_ID);
            assertThat(saved.getDetails()).isEqualTo(DETAILS);
            assertThat(saved.getIpAddress()).isEqualTo(IP_ADDRESS);
            assertThat(saved.getTimestamp()).isNotNull();
        }

        @Test
        @DisplayName("should create activity log without IP address")
        void shouldLogActivityWithoutIpAddress() {
            when(activityLogRepository.save(any(ActivityLog.class))).thenReturn(sampleLog);

            activityLogService.log(USER_ID, ACTION_TYPE, ENTITY_TYPE, ENTITY_ID, DETAILS);

            ArgumentCaptor<ActivityLog> captor = ArgumentCaptor.forClass(ActivityLog.class);
            verify(activityLogRepository).save(captor.capture());

            ActivityLog saved = captor.getValue();
            assertThat(saved.getUserId()).isEqualTo(USER_ID);
            assertThat(saved.getActionType()).isEqualTo(ACTION_TYPE);
            assertThat(saved.getEntityType()).isEqualTo(ENTITY_TYPE);
            assertThat(saved.getEntityId()).isEqualTo(ENTITY_ID);
            assertThat(saved.getDetails()).isEqualTo(DETAILS);
            assertThat(saved.getIpAddress()).isNull();
        }

        @Test
        @DisplayName("should create activity log with only userId, actionType and details")
        void shouldLogActivityMinimalFields() {
            when(activityLogRepository.save(any(ActivityLog.class))).thenReturn(sampleLog);

            activityLogService.log(USER_ID, ACTION_TYPE, DETAILS);

            ArgumentCaptor<ActivityLog> captor = ArgumentCaptor.forClass(ActivityLog.class);
            verify(activityLogRepository).save(captor.capture());

            ActivityLog saved = captor.getValue();
            assertThat(saved.getUserId()).isEqualTo(USER_ID);
            assertThat(saved.getActionType()).isEqualTo(ACTION_TYPE);
            assertThat(saved.getEntityType()).isNull();
            assertThat(saved.getEntityId()).isNull();
            assertThat(saved.getDetails()).isEqualTo(DETAILS);
            assertThat(saved.getIpAddress()).isNull();
        }

        @Test
        @DisplayName("should set timestamp when logging activity")
        void shouldSetTimestampWhenLogging() {
            when(activityLogRepository.save(any(ActivityLog.class))).thenReturn(sampleLog);

            activityLogService.log(USER_ID, ACTION_TYPE, ENTITY_TYPE, ENTITY_ID, DETAILS, IP_ADDRESS);

            ArgumentCaptor<ActivityLog> captor = ArgumentCaptor.forClass(ActivityLog.class);
            verify(activityLogRepository).save(captor.capture());

            assertThat(captor.getValue().getTimestamp()).isNotNull();
        }
    }

    @Nested
    @DisplayName("getActivityLogs - paginated retrieval")
    class GetActivityLogsPaginated {

        @Test
        @DisplayName("should return paginated activity logs with no filters")
        @SuppressWarnings("unchecked")
        void shouldReturnPaginatedLogsNoFilters() {
            Pageable pageable = PageRequest.of(0, 10);
            Page<ActivityLog> page = new PageImpl<>(List.of(sampleLog), pageable, 1);

            when(activityLogRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(page);

            PageResponse<ActivityLogResponse> response = activityLogService.getActivityLogs(
                    null, null, null, null, null, pageable);

            assertThat(response).isNotNull();
            assertThat(response.getContent()).hasSize(1);
            assertThat(response.getTotalElements()).isEqualTo(1);
            assertThat(response.getPage()).isEqualTo(0);
            assertThat(response.getSize()).isEqualTo(10);
            assertThat(response.isLast()).isTrue();
        }

        @Test
        @DisplayName("should return correct response fields mapped from entity")
        @SuppressWarnings("unchecked")
        void shouldMapEntityToResponseCorrectly() {
            Pageable pageable = PageRequest.of(0, 10);
            Page<ActivityLog> page = new PageImpl<>(List.of(sampleLog), pageable, 1);

            when(activityLogRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(page);

            PageResponse<ActivityLogResponse> response = activityLogService.getActivityLogs(
                    null, null, null, null, null, pageable);

            ActivityLogResponse logResponse = response.getContent().get(0);
            assertThat(logResponse.getId()).isEqualTo(1L);
            assertThat(logResponse.getUserId()).isEqualTo(USER_ID);
            assertThat(logResponse.getActionType()).isEqualTo(ACTION_TYPE);
            assertThat(logResponse.getEntityType()).isEqualTo(ENTITY_TYPE);
            assertThat(logResponse.getEntityId()).isEqualTo(ENTITY_ID);
            assertThat(logResponse.getDetails()).isEqualTo(DETAILS);
            assertThat(logResponse.getIpAddress()).isEqualTo(IP_ADDRESS);
            assertThat(logResponse.getTimestamp()).isEqualTo(LocalDateTime.of(2024, 6, 15, 10, 30, 0));
        }

        @Test
        @DisplayName("should return empty page when no logs exist")
        @SuppressWarnings("unchecked")
        void shouldReturnEmptyPageWhenNoLogs() {
            Pageable pageable = PageRequest.of(0, 10);
            Page<ActivityLog> page = new PageImpl<>(List.of(), pageable, 0);

            when(activityLogRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(page);

            PageResponse<ActivityLogResponse> response = activityLogService.getActivityLogs(
                    null, null, null, null, null, pageable);

            assertThat(response.getContent()).isEmpty();
            assertThat(response.getTotalElements()).isEqualTo(0);
        }
    }

    @Nested
    @DisplayName("getActivityLogs - filter by entity type")
    class FilterByEntityType {

        @Test
        @DisplayName("should filter activity logs by entity type")
        @SuppressWarnings("unchecked")
        void shouldFilterByEntityType() {
            Pageable pageable = PageRequest.of(0, 10);
            Page<ActivityLog> page = new PageImpl<>(List.of(sampleLog), pageable, 1);

            when(activityLogRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(page);

            PageResponse<ActivityLogResponse> response = activityLogService.getActivityLogs(
                    null, null, null, null, "PRODUCT", pageable);

            assertThat(response).isNotNull();
            assertThat(response.getContent()).hasSize(1);
            verify(activityLogRepository).findAll(any(Specification.class), eq(pageable));
        }

        @Test
        @DisplayName("should not filter by entity type when value is blank")
        @SuppressWarnings("unchecked")
        void shouldNotFilterByEntityTypeWhenBlank() {
            Pageable pageable = PageRequest.of(0, 10);
            Page<ActivityLog> page = new PageImpl<>(List.of(sampleLog), pageable, 1);

            when(activityLogRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(page);

            PageResponse<ActivityLogResponse> response = activityLogService.getActivityLogs(
                    null, null, null, null, "   ", pageable);

            assertThat(response).isNotNull();
            assertThat(response.getContent()).hasSize(1);
        }
    }

    @Nested
    @DisplayName("getActivityLogs - filter by user")
    class FilterByUser {

        @Test
        @DisplayName("should filter activity logs by user ID")
        @SuppressWarnings("unchecked")
        void shouldFilterByUserId() {
            Pageable pageable = PageRequest.of(0, 10);
            Page<ActivityLog> page = new PageImpl<>(List.of(sampleLog), pageable, 1);

            when(activityLogRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(page);

            PageResponse<ActivityLogResponse> response = activityLogService.getActivityLogs(
                    null, USER_ID, null, null, null, pageable);

            assertThat(response).isNotNull();
            assertThat(response.getContent()).hasSize(1);
            verify(activityLogRepository).findAll(any(Specification.class), eq(pageable));
        }

        @Test
        @DisplayName("should filter by action type")
        @SuppressWarnings("unchecked")
        void shouldFilterByActionType() {
            Pageable pageable = PageRequest.of(0, 10);
            Page<ActivityLog> page = new PageImpl<>(List.of(sampleLog), pageable, 1);

            when(activityLogRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(page);

            PageResponse<ActivityLogResponse> response = activityLogService.getActivityLogs(
                    "CREATE", null, null, null, null, pageable);

            assertThat(response).isNotNull();
            assertThat(response.getContent()).hasSize(1);
            verify(activityLogRepository).findAll(any(Specification.class), eq(pageable));
        }

        @Test
        @DisplayName("should filter by date range")
        @SuppressWarnings("unchecked")
        void shouldFilterByDateRange() {
            Pageable pageable = PageRequest.of(0, 10);
            Page<ActivityLog> page = new PageImpl<>(List.of(sampleLog), pageable, 1);

            when(activityLogRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(page);

            LocalDate dateFrom = LocalDate.of(2024, 6, 1);
            LocalDate dateTo = LocalDate.of(2024, 6, 30);

            PageResponse<ActivityLogResponse> response = activityLogService.getActivityLogs(
                    null, null, dateFrom, dateTo, null, pageable);

            assertThat(response).isNotNull();
            assertThat(response.getContent()).hasSize(1);
            verify(activityLogRepository).findAll(any(Specification.class), eq(pageable));
        }

        @Test
        @DisplayName("should apply multiple filters simultaneously")
        @SuppressWarnings("unchecked")
        void shouldApplyMultipleFilters() {
            Pageable pageable = PageRequest.of(0, 10);
            Page<ActivityLog> page = new PageImpl<>(List.of(sampleLog), pageable, 1);

            when(activityLogRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(page);

            LocalDate dateFrom = LocalDate.of(2024, 6, 1);
            LocalDate dateTo = LocalDate.of(2024, 6, 30);

            PageResponse<ActivityLogResponse> response = activityLogService.getActivityLogs(
                    "CREATE", USER_ID, dateFrom, dateTo, "PRODUCT", pageable);

            assertThat(response).isNotNull();
            assertThat(response.getContent()).hasSize(1);
            verify(activityLogRepository).findAll(any(Specification.class), eq(pageable));
        }
    }
}
