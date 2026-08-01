package com.glydecurtains.controller;

import com.glydecurtains.dto.request.AchievementCreateRequest;
import com.glydecurtains.dto.request.AchievementOrderRequest;
import com.glydecurtains.dto.request.AchievementUpdateRequest;
import com.glydecurtains.dto.response.AchievementResponse;
import com.glydecurtains.dto.response.ApiResponse;
import com.glydecurtains.security.RequiresPermission;
import com.glydecurtains.service.AchievementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/achievements")
@RequiredArgsConstructor
public class AchievementController {

    private final AchievementService achievementService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<AchievementResponse>>> getActiveAchievements() {
        List<AchievementResponse> response = achievementService.getActiveAchievements();
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping
    @RequiresPermission(entity = "achievements", operation = "CREATE")
    public ResponseEntity<ApiResponse<AchievementResponse>> createAchievement(
            @Valid @RequestBody AchievementCreateRequest request) {
        AchievementResponse response = achievementService.createAchievement(request);
        return ResponseEntity.status(201).body(ApiResponse.created("Achievement created successfully", response));
    }

    @PutMapping("/{id}")
    @RequiresPermission(entity = "achievements", operation = "UPDATE")
    public ResponseEntity<ApiResponse<AchievementResponse>> updateAchievement(
            @PathVariable Long id,
            @Valid @RequestBody AchievementUpdateRequest request) {
        AchievementResponse response = achievementService.updateAchievement(id, request);
        return ResponseEntity.ok(ApiResponse.success("Achievement updated successfully", response));
    }

    @DeleteMapping("/{id}")
    @RequiresPermission(entity = "achievements", operation = "DELETE")
    public ResponseEntity<ApiResponse<Void>> deleteAchievement(@PathVariable Long id) {
        achievementService.deleteAchievement(id);
        return ResponseEntity.ok(ApiResponse.noContent());
    }

    @PutMapping("/reorder")
    @RequiresPermission(entity = "achievements", operation = "UPDATE")
    public ResponseEntity<ApiResponse<Void>> reorderAchievements(
            @Valid @RequestBody List<AchievementOrderRequest> orders) {
        achievementService.updateDisplayOrder(orders);
        return ResponseEntity.ok(ApiResponse.noContent());
    }

    @PutMapping("/{id}/toggle")
    @RequiresPermission(entity = "achievements", operation = "UPDATE")
    public ResponseEntity<ApiResponse<AchievementResponse>> toggleVisibility(
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> body) {
        boolean enabled = body.getOrDefault("enabled", true);
        AchievementResponse response = achievementService.toggleVisibility(id, enabled);
        return ResponseEntity.ok(ApiResponse.success("Achievement visibility updated", response));
    }
}
