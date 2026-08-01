package com.glydecurtains.dto.response;

import com.glydecurtains.entity.enums.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PermissionMatrixResponse {

    private List<String> entities;
    private List<String> operations;
    private Map<String, List<RolePermissionEntry>> matrix;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RolePermissionEntry {
        private String entity;
        private String operation;
        private Boolean granted;
    }
}
