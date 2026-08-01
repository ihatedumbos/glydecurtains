package com.glydecurtains.service;

import com.glydecurtains.dto.request.AchievementCreateRequest;
import com.glydecurtains.dto.request.AchievementOrderRequest;
import com.glydecurtains.dto.request.AchievementUpdateRequest;
import com.glydecurtains.dto.response.AchievementResponse;

import java.util.List;

public interface AchievementService {

    AchievementResponse createAchievement(AchievementCreateRequest request);

    AchievementResponse updateAchievement(Long id, AchievementUpdateRequest request);

    void deleteAchievement(Long id);

    List<AchievementResponse> getActiveAchievements();

    List<AchievementResponse> getAllAchievements();

    void updateDisplayOrder(List<AchievementOrderRequest> orders);

    AchievementResponse toggleVisibility(Long id, boolean enabled);
}
