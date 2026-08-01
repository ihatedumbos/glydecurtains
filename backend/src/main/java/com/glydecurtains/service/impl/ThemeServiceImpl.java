package com.glydecurtains.service.impl;

import com.glydecurtains.dto.request.ThemeConfigUpdateRequest;
import com.glydecurtains.dto.response.ThemePresetResponse;
import com.glydecurtains.entity.ThemePreset;
import com.glydecurtains.exception.BusinessException;
import com.glydecurtains.repository.ThemePresetRepository;
import com.glydecurtains.service.ThemeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ThemeServiceImpl implements ThemeService {

    private final ThemePresetRepository themePresetRepository;

    @Override
    @Transactional(readOnly = true)
    public ThemePresetResponse getActiveTheme() {
        ThemePreset active = themePresetRepository.findByIsActiveTrue()
                .orElseGet(() -> themePresetRepository.findByIsDefaultTrue()
                        .orElseThrow(() -> new BusinessException(
                                "No active or default theme found",
                                "THEME_NOT_FOUND",
                                HttpStatus.NOT_FOUND)));
        return mapToResponse(active);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ThemePresetResponse> getAllThemes() {
        return themePresetRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public ThemePresetResponse activateTheme(Long id) {
        ThemePreset theme = themePresetRepository.findById(id)
                .orElseThrow(() -> new BusinessException(
                        "Theme preset not found",
                        "THEME_NOT_FOUND",
                        HttpStatus.NOT_FOUND));

        // Deactivate currently active theme
        themePresetRepository.findByIsActiveTrue().ifPresent(currentActive -> {
            currentActive.setIsActive(false);
            themePresetRepository.save(currentActive);
        });

        // Activate the selected theme
        theme.setIsActive(true);
        ThemePreset saved = themePresetRepository.save(theme);
        return mapToResponse(saved);
    }

    @Override
    public ThemePresetResponse updateThemeConfig(Long id, ThemeConfigUpdateRequest request) {
        ThemePreset theme = themePresetRepository.findById(id)
                .orElseThrow(() -> new BusinessException(
                        "Theme preset not found",
                        "THEME_NOT_FOUND",
                        HttpStatus.NOT_FOUND));

        theme.setConfig(request.getConfig());
        ThemePreset saved = themePresetRepository.save(theme);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public ThemePresetResponse previewTheme(Long id) {
        ThemePreset theme = themePresetRepository.findById(id)
                .orElseThrow(() -> new BusinessException(
                        "Theme preset not found",
                        "THEME_NOT_FOUND",
                        HttpStatus.NOT_FOUND));
        return mapToResponse(theme);
    }

    private ThemePresetResponse mapToResponse(ThemePreset theme) {
        return ThemePresetResponse.builder()
                .id(theme.getId())
                .name(theme.getName())
                .config(theme.getConfig())
                .isDefault(theme.getIsDefault())
                .isActive(theme.getIsActive())
                .createdAt(theme.getCreatedAt())
                .updatedAt(theme.getUpdatedAt())
                .build();
    }
}
