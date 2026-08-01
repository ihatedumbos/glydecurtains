package com.glydecurtains.service;

import com.glydecurtains.dto.request.AchievementCreateRequest;
import com.glydecurtains.dto.request.AchievementOrderRequest;
import com.glydecurtains.dto.request.AchievementUpdateRequest;
import com.glydecurtains.dto.response.AchievementResponse;
import com.glydecurtains.entity.Achievement;
import com.glydecurtains.entity.enums.MetricFormat;
import com.glydecurtains.exception.BusinessException;
import com.glydecurtains.repository.AchievementRepository;
import com.glydecurtains.service.impl.AchievementServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AchievementServiceTest {

    @Mock
    private AchievementRepository achievementRepository;

    @InjectMocks
    private AchievementServiceImpl achievementService;

    private Achievement sampleAchievement;

    @BeforeEach
    void setUp() {
        sampleAchievement = new Achievement();
        sampleAchievement.setId(1L);
        sampleAchievement.setTitle("10,000+ Happy Customers");
        sampleAchievement.setDescription("Serving customers since 2005");
        sampleAchievement.setIconBase64("aWNvbi1kYXRh");
        sampleAchievement.setYear(2020);
        sampleAchievement.setMetricValue("10000+");
        sampleAchievement.setMetricFormat(MetricFormat.NUMERIC_SUFFIX);
        sampleAchievement.setSortOrder(1);
        sampleAchievement.setIsEnabled(true);
    }

    @Nested
    @DisplayName("Create Achievement")
    class CreateAchievementTests {

        @Test
        @DisplayName("should create achievement with valid request and default values")
        void createAchievement_withValidRequest_shouldReturnResponse() {
            AchievementCreateRequest request = new AchievementCreateRequest();
            request.setTitle("500+ Products");
            request.setDescription("Wide range of curtains");
            request.setIconBase64("aWNvbi1kYXRh");
            request.setYear(2022);
            request.setMetricValue("500+");
            request.setMetricFormat(MetricFormat.NUMERIC_SUFFIX);
            request.setSortOrder(2);

            Achievement saved = new Achievement();
            saved.setId(2L);
            saved.setTitle(request.getTitle());
            saved.setDescription(request.getDescription());
            saved.setIconBase64(request.getIconBase64());
            saved.setYear(request.getYear());
            saved.setMetricValue(request.getMetricValue());
            saved.setMetricFormat(MetricFormat.NUMERIC_SUFFIX);
            saved.setSortOrder(2);
            saved.setIsEnabled(true);

            when(achievementRepository.save(any(Achievement.class))).thenReturn(saved);

            AchievementResponse response = achievementService.createAchievement(request);

            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(2L);
            assertThat(response.getTitle()).isEqualTo("500+ Products");
            assertThat(response.getMetricFormat()).isEqualTo(MetricFormat.NUMERIC_SUFFIX);
            assertThat(response.getIsEnabled()).isTrue();
            verify(achievementRepository).save(any(Achievement.class));
        }

        @Test
        @DisplayName("should default metricFormat to NUMERIC_SUFFIX when null")
        void createAchievement_withNullMetricFormat_shouldDefaultToNumericSuffix() {
            AchievementCreateRequest request = new AchievementCreateRequest();
            request.setTitle("Achievement");
            request.setMetricFormat(null);
            request.setSortOrder(null);

            Achievement saved = new Achievement();
            saved.setId(3L);
            saved.setTitle("Achievement");
            saved.setMetricFormat(MetricFormat.NUMERIC_SUFFIX);
            saved.setSortOrder(0);
            saved.setIsEnabled(true);

            when(achievementRepository.save(any(Achievement.class))).thenReturn(saved);

            AchievementResponse response = achievementService.createAchievement(request);

            assertThat(response.getMetricFormat()).isEqualTo(MetricFormat.NUMERIC_SUFFIX);
            assertThat(response.getSortOrder()).isEqualTo(0);
        }

        @Test
        @DisplayName("should throw BusinessException when year is before 1900")
        void createAchievement_withYearBefore1900_shouldThrowException() {
            AchievementCreateRequest request = new AchievementCreateRequest();
            request.setTitle("Old Achievement");
            request.setYear(1899);

            assertThatThrownBy(() -> achievementService.createAchievement(request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Year must be between 1900 and");
        }

        @Test
        @DisplayName("should throw BusinessException when year is in the future")
        void createAchievement_withFutureYear_shouldThrowException() {
            AchievementCreateRequest request = new AchievementCreateRequest();
            request.setTitle("Future Achievement");
            request.setYear(2999);

            assertThatThrownBy(() -> achievementService.createAchievement(request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Year must be between 1900 and");
        }

        @Test
        @DisplayName("should throw BusinessException when icon exceeds 2MB")
        void createAchievement_withOversizedIcon_shouldThrowException() {
            AchievementCreateRequest request = new AchievementCreateRequest();
            request.setTitle("Icon Achievement");
            // Create a Base64 string that decodes to > 2MB
            // 2MB = 2 * 1024 * 1024 = 2097152 bytes. Base64 inflates by 4/3, so ~2796203 chars needed.
            String largeIcon = "A".repeat(2_800_000);
            request.setIconBase64(largeIcon);

            assertThatThrownBy(() -> achievementService.createAchievement(request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Icon size must not exceed 2MB");
        }
    }

    @Nested
    @DisplayName("Update Achievement")
    class UpdateAchievementTests {

        @Test
        @DisplayName("should update achievement fields when valid request provided")
        void updateAchievement_withValidRequest_shouldReturnUpdatedResponse() {
            AchievementUpdateRequest request = new AchievementUpdateRequest();
            request.setTitle("Updated Title");
            request.setDescription("Updated Description");
            request.setYear(2023);
            request.setMetricValue("20000+");
            request.setMetricFormat(MetricFormat.PLAIN_TEXT);
            request.setSortOrder(5);

            Achievement updated = new Achievement();
            updated.setId(1L);
            updated.setTitle("Updated Title");
            updated.setDescription("Updated Description");
            updated.setYear(2023);
            updated.setMetricValue("20000+");
            updated.setMetricFormat(MetricFormat.PLAIN_TEXT);
            updated.setSortOrder(5);
            updated.setIsEnabled(true);

            when(achievementRepository.findById(1L)).thenReturn(Optional.of(sampleAchievement));
            when(achievementRepository.save(any(Achievement.class))).thenReturn(updated);

            AchievementResponse response = achievementService.updateAchievement(1L, request);

            assertThat(response.getTitle()).isEqualTo("Updated Title");
            assertThat(response.getMetricFormat()).isEqualTo(MetricFormat.PLAIN_TEXT);
            verify(achievementRepository).save(any(Achievement.class));
        }

        @Test
        @DisplayName("should only update non-null fields (partial update)")
        void updateAchievement_withPartialFields_shouldOnlyUpdateProvided() {
            AchievementUpdateRequest request = new AchievementUpdateRequest();
            request.setTitle("New Title Only");

            when(achievementRepository.findById(1L)).thenReturn(Optional.of(sampleAchievement));
            when(achievementRepository.save(any(Achievement.class))).thenReturn(sampleAchievement);

            achievementService.updateAchievement(1L, request);

            verify(achievementRepository).save(argThat(achievement ->
                    achievement.getTitle().equals("New Title Only") &&
                    achievement.getDescription().equals("Serving customers since 2005")
            ));
        }

        @Test
        @DisplayName("should throw BusinessException when achievement not found")
        void updateAchievement_withNonExistentId_shouldThrowException() {
            AchievementUpdateRequest request = new AchievementUpdateRequest();
            request.setTitle("New Title");

            when(achievementRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> achievementService.updateAchievement(99L, request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Achievement not found");
        }

        @Test
        @DisplayName("should throw BusinessException when update year is invalid")
        void updateAchievement_withInvalidYear_shouldThrowException() {
            AchievementUpdateRequest request = new AchievementUpdateRequest();
            request.setYear(1800);

            when(achievementRepository.findById(1L)).thenReturn(Optional.of(sampleAchievement));

            assertThatThrownBy(() -> achievementService.updateAchievement(1L, request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Year must be between 1900 and");
        }

        @Test
        @DisplayName("should throw BusinessException when update icon exceeds 2MB")
        void updateAchievement_withOversizedIcon_shouldThrowException() {
            AchievementUpdateRequest request = new AchievementUpdateRequest();
            String largeIcon = "A".repeat(2_800_000);
            request.setIconBase64(largeIcon);

            when(achievementRepository.findById(1L)).thenReturn(Optional.of(sampleAchievement));

            assertThatThrownBy(() -> achievementService.updateAchievement(1L, request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Icon size must not exceed 2MB");
        }
    }

    @Nested
    @DisplayName("Delete Achievement")
    class DeleteAchievementTests {

        @Test
        @DisplayName("should delete achievement when it exists")
        void deleteAchievement_withExistingId_shouldDeleteSuccessfully() {
            when(achievementRepository.findById(1L)).thenReturn(Optional.of(sampleAchievement));

            achievementService.deleteAchievement(1L);

            verify(achievementRepository).delete(sampleAchievement);
        }

        @Test
        @DisplayName("should throw BusinessException when achievement not found for deletion")
        void deleteAchievement_withNonExistentId_shouldThrowException() {
            when(achievementRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> achievementService.deleteAchievement(99L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Achievement not found");
        }
    }

    @Nested
    @DisplayName("Reorder Achievements")
    class ReorderAchievementsTests {

        @Test
        @DisplayName("should update sort order for all achievements in the list")
        void updateDisplayOrder_withValidOrders_shouldUpdateSortOrder() {
            Achievement achievement1 = new Achievement();
            achievement1.setId(1L);
            achievement1.setSortOrder(0);

            Achievement achievement2 = new Achievement();
            achievement2.setId(2L);
            achievement2.setSortOrder(1);

            AchievementOrderRequest order1 = new AchievementOrderRequest(1L, 2);
            AchievementOrderRequest order2 = new AchievementOrderRequest(2L, 1);

            when(achievementRepository.findById(1L)).thenReturn(Optional.of(achievement1));
            when(achievementRepository.findById(2L)).thenReturn(Optional.of(achievement2));
            when(achievementRepository.save(any(Achievement.class))).thenAnswer(invocation -> invocation.getArgument(0));

            achievementService.updateDisplayOrder(Arrays.asList(order1, order2));

            verify(achievementRepository, times(2)).save(any(Achievement.class));
            assertThat(achievement1.getSortOrder()).isEqualTo(2);
            assertThat(achievement2.getSortOrder()).isEqualTo(1);
        }

        @Test
        @DisplayName("should throw BusinessException when an achievement in the order list is not found")
        void updateDisplayOrder_withNonExistentId_shouldThrowException() {
            AchievementOrderRequest order = new AchievementOrderRequest(99L, 1);

            when(achievementRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> achievementService.updateDisplayOrder(List.of(order)))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Achievement not found");
        }
    }

    @Nested
    @DisplayName("Toggle Visibility")
    class ToggleVisibilityTests {

        @Test
        @DisplayName("should enable achievement visibility")
        void toggleVisibility_enable_shouldSetIsEnabledTrue() {
            sampleAchievement.setIsEnabled(false);

            Achievement saved = new Achievement();
            saved.setId(1L);
            saved.setTitle(sampleAchievement.getTitle());
            saved.setIsEnabled(true);

            when(achievementRepository.findById(1L)).thenReturn(Optional.of(sampleAchievement));
            when(achievementRepository.save(any(Achievement.class))).thenReturn(saved);

            AchievementResponse response = achievementService.toggleVisibility(1L, true);

            assertThat(response.getIsEnabled()).isTrue();
            verify(achievementRepository).save(argThat(Achievement::getIsEnabled));
        }

        @Test
        @DisplayName("should disable achievement visibility")
        void toggleVisibility_disable_shouldSetIsEnabledFalse() {
            sampleAchievement.setIsEnabled(true);

            Achievement saved = new Achievement();
            saved.setId(1L);
            saved.setTitle(sampleAchievement.getTitle());
            saved.setIsEnabled(false);

            when(achievementRepository.findById(1L)).thenReturn(Optional.of(sampleAchievement));
            when(achievementRepository.save(any(Achievement.class))).thenReturn(saved);

            AchievementResponse response = achievementService.toggleVisibility(1L, false);

            assertThat(response.getIsEnabled()).isFalse();
            verify(achievementRepository).save(argThat(a -> !a.getIsEnabled()));
        }

        @Test
        @DisplayName("should throw BusinessException when achievement not found for toggle")
        void toggleVisibility_withNonExistentId_shouldThrowException() {
            when(achievementRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> achievementService.toggleVisibility(99L, true))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Achievement not found");
        }
    }
}
