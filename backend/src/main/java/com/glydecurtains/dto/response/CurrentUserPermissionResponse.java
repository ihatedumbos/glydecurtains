package com.glydecurtains.dto.response;

import com.glydecurtains.entity.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CurrentUserPermissionResponse {

    private Long userId;
    private UserRole role;
    private List<PermissionGrant> permissions;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PermissionGrant {
        private String entity;
        private String operation;
        private Boolean granted;
    }
}
