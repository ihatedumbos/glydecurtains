package com.glydecurtains.service.impl;

import com.glydecurtains.dto.request.AchievementCreateRequest;
import com.glydecurtains.dto.request.AchievementOrderRequest;
import com.glydecurtains.dto.request.AchievementUpdateRequest;
import com.glydecurtains.dto.response.AchievementResponse;
import com.glydecurtains.entity.Achievement;
import com.glydecurtains.entity.enums.MetricFormat;
import com.glydecurtains.exception.BusinessException;
import com.glydecurtains.repository.AchievementRepository;
import com.glydecurtains.service.AchievementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class AchievementServiceImpl implements AchievementService {

    private static final int MAX_ICON_SIZE_BYTES = 2 * 1024 * 1024; // 2MB in Base64

    private final AchievementRepository achievementRepository;

    @Override
    public AchievementResponse createAchievement(AchievementCreateRequest request) {
        validateYear(request.getYear());
        validateIconSize(request.getIconBase64());

        Achievement achievement = new Achievement();
        achievement.setTitle(request.getTitle());
        achievement.setDescription(request.getDescription());
        achievement.setIconBase64(request.getIconBase64());
        achievement.setYear(request.getYear());
        achievement.setMetricValue(request.getMetricValue());
        achievement.setMetricFormat(request.getMetricFormat() != null ? request.getMetricFormat() : MetricFormat.NUMERIC_SUFFIX);
        achievement.setSortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0);
        achievement.setIsEnabled(true);

        Achievement saved = achievementRepository.save(achievement);
        return mapToResponse(saved);
    }

    @Override
    public AchievementResponse updateAchievement(Long id, AchievementUpdateRequest request) {
        Achievement achievement = achievementRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Achievement not found", "ACHIEVEMENT_NOT_FOUND", HttpStatus.NOT_FOUND));

        if (request.getTitle() != null) {
            achievement.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            achievement.setDescription(request.getDescription());
        }
        if (request.getIconBase64() != null) {
            validateIconSize(request.getIconBase64());
            achievement.setIconBase64(request.getIconBase64());
        }
        if (request.getYear() != null) {
            validateYear(request.getYear());
            achievement.setYear(request.getYear());
        }
        if (request.getMetricValue() != null) {
            achievement.setMetricValue(request.getMetricValue());
        }
        if (request.getMetricFormat() != null) {
            achievement.setMetricFormat(request.getMetricFormat());
        }
        if (request.getSortOrder() != null) {
            achievement.setSortOrder(request.getSortOrder());
        }
        if (request.getIsEnabled() != null) {
            achievement.setIsEnabled(request.getIsEnabled());
        }

        Achievement saved = achievementRepository.save(achievement);
        return mapToResponse(saved);
    }

    @Override
    public void deleteAchievement(Long id) {
        Achievement achievement = achievementRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Achievement not found", "ACHIEVEMENT_NOT_FOUND", HttpStatus.NOT_FOUND));
        achievementRepository.delete(achievement);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AchievementResponse> getActiveAchievements() {
        return achievementRepository.findByIsEnabledTrueOrderBySortOrderAsc()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AchievementResponse> getAllAchievements() {
        return achievementRepository.findAllByOrderBySortOrderAsc()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public void updateDisplayOrder(List<AchievementOrderRequest> orders) {
        for (AchievementOrderRequest order : orders) {
            Achievement achievement = achievementRepository.findById(order.getId())
                    .orElseThrow(() -> new BusinessException("Achievement not found with id: " + order.getId(), "ACHIEVEMENT_NOT_FOUND", HttpStatus.NOT_FOUND));
            achievement.setSortOrder(order.getSortOrder());
            achievementRepository.save(achievement);
        }
    }

    @Override
    public AchievementResponse toggleVisibility(Long id, boolean enabled) {
        Achievement achievement = achievementRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Achievement not found", "ACHIEVEMENT_NOT_FOUND", HttpStatus.NOT_FOUND));
        achievement.setIsEnabled(enabled);
        Achievement saved = achievementRepository.save(achievement);
        return mapToResponse(saved);
    }

    private void validateYear(Integer year) {
        if (year != null) {
            int currentYear = LocalDateTime.now().getYear();
            if (year < 1900 || year > currentYear) {
                throw new BusinessException(
                        "Year must be between 1900 and " + currentYear,
                        "INVALID_YEAR",
                        HttpStatus.BAD_REQUEST);
            }
        }
    }

    private void validateIconSize(String iconBase64) {
        if (iconBase64 != null && !iconBase64.isEmpty()) {
            // Base64 encoding inflates size by ~33%, so we check the encoded string length
            // A 2MB binary becomes ~2.67MB in Base64. We check the Base64 string itself.
            int base64Length = iconBase64.length();
            // Approximate original byte size: base64Length * 3 / 4
            long originalBytes = (long) base64Length * 3 / 4;
            if (originalBytes > MAX_ICON_SIZE_BYTES) {
                throw new BusinessException(
                        "Icon size must not exceed 2MB",
                        "ICON_TOO_LARGE",
                        HttpStatus.BAD_REQUEST);
            }
        }
    }

    private AchievementResponse mapToResponse(Achievement achievement) {
        return AchievementResponse.builder()
                .id(achievement.getId())
                .title(achievement.getTitle())
                .description(achievement.getDescription())
                .iconBase64(achievement.getIconBase64())
                .year(achievement.getYear())
                .metricValue(achievement.getMetricValue())
                .metricFormat(achievement.getMetricFormat())
                .sortOrder(achievement.getSortOrder())
                .isEnabled(achievement.getIsEnabled())
                .createdAt(achievement.getCreatedAt())
                .updatedAt(achievement.getUpdatedAt())
                .build();
    }
}
