package com.glydecurtains.controller;

import com.glydecurtains.dto.request.ThemeConfigUpdateRequest;
import com.glydecurtains.dto.response.ApiResponse;
import com.glydecurtains.dto.response.HomepageSectionResponse;
import com.glydecurtains.dto.response.ThemePresetResponse;
import com.glydecurtains.security.RequiresPermission;
import com.glydecurtains.service.CmsService;
import com.glydecurtains.service.ThemeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cms")
@RequiredArgsConstructor
public class CmsController {

    private final ThemeService themeService;

    private final CmsService cmsService;
    // --- Theme endpoints ---

    @GetMapping("/public/sections")
    public ResponseEntity<ApiResponse<List<HomepageSectionResponse>>> getPublicSections(
            @RequestHeader(value = "Accept-Language", required = false, defaultValue = "en") String language) {
        return ResponseEntity.ok(ApiResponse.success(cmsService.getEnabledSections(language)));
    }

    @GetMapping("/themes")
    public ResponseEntity<ApiResponse<ThemePresetResponse>> getActiveTheme() {
        ThemePresetResponse response = themeService.getActiveTheme();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/themes/all")
    @RequiresPermission(entity = "cms", operation = "READ")
    public ResponseEntity<ApiResponse<List<ThemePresetResponse>>> getAllThemes() {
        List<ThemePresetResponse> response = themeService.getAllThemes();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/themes/{id}/activate")
    @RequiresPermission(entity = "cms", operation = "UPDATE")
    public ResponseEntity<ApiResponse<ThemePresetResponse>> activateTheme(@PathVariable Long id) {
        ThemePresetResponse response = themeService.activateTheme(id);
        return ResponseEntity.ok(ApiResponse.success("Theme activated successfully", response));
    }

    @PutMapping("/themes/{id}")
    @RequiresPermission(entity = "cms", operation = "UPDATE")
    public ResponseEntity<ApiResponse<ThemePresetResponse>> updateThemeConfig(
            @PathVariable Long id,
            @Valid @RequestBody ThemeConfigUpdateRequest request) {
        ThemePresetResponse response = themeService.updateThemeConfig(id, request);
        return ResponseEntity.ok(ApiResponse.success("Theme config updated successfully", response));
    }

    @GetMapping("/themes/{id}/preview")
    @RequiresPermission(entity = "cms", operation = "READ")
    public ResponseEntity<ApiResponse<ThemePresetResponse>> previewTheme(@PathVariable Long id) {
        ThemePresetResponse response = themeService.previewTheme(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
