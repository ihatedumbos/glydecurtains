package com.glydecurtains.service;

import com.glydecurtains.dto.request.ThemeConfigUpdateRequest;
import com.glydecurtains.dto.response.ThemePresetResponse;
import com.glydecurtains.entity.ThemePreset;
import com.glydecurtains.exception.BusinessException;
import com.glydecurtains.repository.ThemePresetRepository;
import com.glydecurtains.service.impl.ThemeServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ThemeServiceTest {

    @Mock
    private ThemePresetRepository themePresetRepository;

    @InjectMocks
    private ThemeServiceImpl themeService;

    private ThemePreset darkPremiumTheme;
    private ThemePreset lightElegantTheme;

    private static final Long DARK_PREMIUM_ID = 1L;
    private static final Long LIGHT_ELEGANT_ID = 2L;
    private static final String DARK_PREMIUM_CONFIG = "{\"primaryColor\":\"#1a1a2e\",\"secondaryColor\":\"#16213e\",\"accentColor\":\"#e94560\",\"backgroundColor\":\"#0f0f23\",\"textColor\":\"#ffffff\",\"borderRadius\":\"12px\",\"shadowIntensity\":\"high\",\"glassmorphismOpacity\":0.15,\"animationSpeed\":\"0.3s\"}";
    private static final String LIGHT_ELEGANT_CONFIG = "{\"primaryColor\":\"#ffffff\",\"secondaryColor\":\"#f8f9fa\",\"accentColor\":\"#6c63ff\",\"backgroundColor\":\"#fefefe\",\"textColor\":\"#2d3436\",\"borderRadius\":\"8px\",\"shadowIntensity\":\"medium\",\"glassmorphismOpacity\":0.1,\"animationSpeed\":\"0.25s\"}";

    @BeforeEach
    void setUp() {
        darkPremiumTheme = new ThemePreset();
        darkPremiumTheme.setId(DARK_PREMIUM_ID);
        darkPremiumTheme.setName("Dark Premium");
        darkPremiumTheme.setConfig(DARK_PREMIUM_CONFIG);
        darkPremiumTheme.setIsDefault(true);
        darkPremiumTheme.setIsActive(true);
        darkPremiumTheme.setCreatedAt(LocalDateTime.now());
        darkPremiumTheme.setUpdatedAt(LocalDateTime.now());

        lightElegantTheme = new ThemePreset();
        lightElegantTheme.setId(LIGHT_ELEGANT_ID);
        lightElegantTheme.setName("Light Elegant");
        lightElegantTheme.setConfig(LIGHT_ELEGANT_CONFIG);
        lightElegantTheme.setIsDefault(false);
        lightElegantTheme.setIsActive(false);
        lightElegantTheme.setCreatedAt(LocalDateTime.now());
        lightElegantTheme.setUpdatedAt(LocalDateTime.now());
    }

    @Nested
    @DisplayName("getActiveTheme")
    class GetActiveTheme {

        @Test
        @DisplayName("should return active theme when one exists")
        void shouldReturnActiveTheme() {
            when(themePresetRepository.findByIsActiveTrue()).thenReturn(Optional.of(darkPremiumTheme));

            ThemePresetResponse response = themeService.getActiveTheme();

            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(DARK_PREMIUM_ID);
            assertThat(response.getName()).isEqualTo("Dark Premium");
            assertThat(response.getConfig()).isEqualTo(DARK_PREMIUM_CONFIG);
            assertThat(response.getIsDefault()).isTrue();
            assertThat(response.getIsActive()).isTrue();
        }

        @Test
        @DisplayName("should fall back to default theme when no active theme")
        void shouldFallBackToDefaultTheme() {
            when(themePresetRepository.findByIsActiveTrue()).thenReturn(Optional.empty());
            when(themePresetRepository.findByIsDefaultTrue()).thenReturn(Optional.of(darkPremiumTheme));

            ThemePresetResponse response = themeService.getActiveTheme();

            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(DARK_PREMIUM_ID);
            assertThat(response.getName()).isEqualTo("Dark Premium");
        }

        @Test
        @DisplayName("should throw BusinessException when no active or default theme found")
        void shouldThrowWhenNoActiveOrDefaultTheme() {
            when(themePresetRepository.findByIsActiveTrue()).thenReturn(Optional.empty());
            when(themePresetRepository.findByIsDefaultTrue()).thenReturn(Optional.empty());

            assertThatThrownBy(() -> themeService.getActiveTheme())
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("No active or default theme found");
        }
    }

    @Nested
    @DisplayName("getAllThemes")
    class GetAllThemes {

        @Test
        @DisplayName("should return all theme presets")
        void shouldReturnAllPresets() {
            when(themePresetRepository.findAll()).thenReturn(List.of(darkPremiumTheme, lightElegantTheme));

            List<ThemePresetResponse> responses = themeService.getAllThemes();

            assertThat(responses).hasSize(2);
            assertThat(responses.get(0).getName()).isEqualTo("Dark Premium");
            assertThat(responses.get(1).getName()).isEqualTo("Light Elegant");
        }

        @Test
        @DisplayName("should return empty list when no presets exist")
        void shouldReturnEmptyListWhenNoPresets() {
            when(themePresetRepository.findAll()).thenReturn(List.of());

            List<ThemePresetResponse> responses = themeService.getAllThemes();

            assertThat(responses).isEmpty();
        }
    }

    @Nested
    @DisplayName("activateTheme")
    class ActivateTheme {

        @Test
        @DisplayName("should activate theme and deactivate current active")
        void shouldActivateThemeAndDeactivateCurrent() {
            when(themePresetRepository.findById(LIGHT_ELEGANT_ID)).thenReturn(Optional.of(lightElegantTheme));
            when(themePresetRepository.findByIsActiveTrue()).thenReturn(Optional.of(darkPremiumTheme));
            when(themePresetRepository.save(any(ThemePreset.class))).thenAnswer(invocation -> invocation.getArgument(0));

            ThemePresetResponse response = themeService.activateTheme(LIGHT_ELEGANT_ID);

            assertThat(response).isNotNull();
            assertThat(response.getName()).isEqualTo("Light Elegant");
            assertThat(response.getIsActive()).isTrue();

            verify(themePresetRepository, times(2)).save(any(ThemePreset.class));
            assertThat(darkPremiumTheme.getIsActive()).isFalse();
            assertThat(lightElegantTheme.getIsActive()).isTrue();
        }

        @Test
        @DisplayName("should activate theme when no current active theme exists")
        void shouldActivateThemeWhenNoneActive() {
            when(themePresetRepository.findById(LIGHT_ELEGANT_ID)).thenReturn(Optional.of(lightElegantTheme));
            when(themePresetRepository.findByIsActiveTrue()).thenReturn(Optional.empty());
            when(themePresetRepository.save(any(ThemePreset.class))).thenAnswer(invocation -> invocation.getArgument(0));

            ThemePresetResponse response = themeService.activateTheme(LIGHT_ELEGANT_ID);

            assertThat(response).isNotNull();
            assertThat(response.getIsActive()).isTrue();
            verify(themePresetRepository, times(1)).save(any(ThemePreset.class));
        }

        @Test
        @DisplayName("should throw BusinessException when theme not found")
        void shouldThrowWhenThemeNotFound() {
            when(themePresetRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> themeService.activateTheme(999L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Theme preset not found");
        }
    }

    @Nested
    @DisplayName("updateThemeConfig")
    class UpdateThemeConfig {

        @Test
        @DisplayName("should update theme configuration successfully")
        void shouldUpdateThemeConfig() {
            String newConfig = "{\"primaryColor\":\"#ff0000\",\"secondaryColor\":\"#00ff00\",\"accentColor\":\"#0000ff\",\"backgroundColor\":\"#111111\",\"textColor\":\"#eeeeee\",\"borderRadius\":\"16px\",\"shadowIntensity\":\"low\",\"glassmorphismOpacity\":0.2,\"animationSpeed\":\"0.5s\"}";
            ThemeConfigUpdateRequest request = new ThemeConfigUpdateRequest(newConfig);

            when(themePresetRepository.findById(DARK_PREMIUM_ID)).thenReturn(Optional.of(darkPremiumTheme));
            when(themePresetRepository.save(any(ThemePreset.class))).thenAnswer(invocation -> invocation.getArgument(0));

            ThemePresetResponse response = themeService.updateThemeConfig(DARK_PREMIUM_ID, request);

            assertThat(response).isNotNull();
            assertThat(response.getConfig()).isEqualTo(newConfig);
            verify(themePresetRepository).save(darkPremiumTheme);
        }

        @Test
        @DisplayName("should throw BusinessException when theme not found for update")
        void shouldThrowWhenThemeNotFoundForUpdate() {
            ThemeConfigUpdateRequest request = new ThemeConfigUpdateRequest("{\"primaryColor\":\"#000\"}");

            when(themePresetRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> themeService.updateThemeConfig(999L, request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Theme preset not found");
        }
    }

    @Nested
    @DisplayName("previewTheme")
    class PreviewTheme {

        @Test
        @DisplayName("should return theme for preview without modifying state")
        void shouldReturnThemeForPreview() {
            when(themePresetRepository.findById(LIGHT_ELEGANT_ID)).thenReturn(Optional.of(lightElegantTheme));

            ThemePresetResponse response = themeService.previewTheme(LIGHT_ELEGANT_ID);

            assertThat(response).isNotNull();
            assertThat(response.getId()).isEqualTo(LIGHT_ELEGANT_ID);
            assertThat(response.getName()).isEqualTo("Light Elegant");
            assertThat(response.getIsActive()).isFalse();
            verify(themePresetRepository, never()).save(any());
        }

        @Test
        @DisplayName("should throw BusinessException when theme not found for preview")
        void shouldThrowWhenThemeNotFoundForPreview() {
            when(themePresetRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> themeService.previewTheme(999L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Theme preset not found");
        }
    }
}
