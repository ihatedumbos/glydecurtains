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
public class UserPermissionResponse {

    private Long userId;
    private String userName;
    private String email;
    private UserRole role;
    private List<ResolvedPermission> permissions;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResolvedPermission {
        private String entity;
        private String operation;
        private Boolean granted;
        private String source; // "ROLE", "USER_OVERRIDE", or "IMPLICIT_DENY"
    }
}
