package com.glydecurtains.service;

import com.glydecurtains.dto.request.ThemeConfigUpdateRequest;
import com.glydecurtains.dto.response.ThemePresetResponse;

import java.util.List;

public interface ThemeService {

    ThemePresetResponse getActiveTheme();

    List<ThemePresetResponse> getAllThemes();

    ThemePresetResponse activateTheme(Long id);

    ThemePresetResponse updateThemeConfig(Long id, ThemeConfigUpdateRequest request);

    ThemePresetResponse previewTheme(Long id);
}
