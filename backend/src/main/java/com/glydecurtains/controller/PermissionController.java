package com.glydecurtains.controller;

import com.glydecurtains.dto.request.PermissionUpdateRequest;
import com.glydecurtains.dto.response.ApiResponse;
import com.glydecurtains.dto.response.CurrentUserPermissionResponse;
import com.glydecurtains.dto.response.PermissionMatrixResponse;
import com.glydecurtains.dto.response.UserPermissionResponse;
import com.glydecurtains.security.RequiresPermission;
import com.glydecurtains.service.PermissionService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/permissions")
public class PermissionController {

    private final PermissionService permissionService;

    public PermissionController(PermissionService permissionService) {
        this.permissionService = permissionService;
    }

    @GetMapping("/matrix")
    @RequiresPermission(entity = "permissions", operation = "READ")
    public ResponseEntity<ApiResponse<PermissionMatrixResponse>> getPermissionMatrix() {
        PermissionMatrixResponse matrix = permissionService.getPermissionMatrix();
        return ResponseEntity.ok(ApiResponse.success(matrix));
    }

    @PutMapping("/roles/{roleId}")
    @RequiresPermission(entity = "permissions", operation = "UPDATE")
    public ResponseEntity<ApiResponse<PermissionMatrixResponse>> updateRolePermissions(
            @PathVariable Long roleId,
            @Valid @RequestBody List<PermissionUpdateRequest> permissions) {
        PermissionMatrixResponse matrix = permissionService.updateRolePermissions(roleId, permissions);
        return ResponseEntity.ok(ApiResponse.success("Role permissions updated successfully", matrix));
    }

    @PutMapping("/users/{userId}")
    @RequiresPermission(entity = "permissions", operation = "UPDATE")
    public ResponseEntity<ApiResponse<PermissionMatrixResponse>> updateUserPermissions(
            @PathVariable Long userId,
            @Valid @RequestBody List<PermissionUpdateRequest> permissions) {
        PermissionMatrixResponse matrix = permissionService.updateUserPermissions(userId, permissions);
        return ResponseEntity.ok(ApiResponse.success("User permissions updated successfully", matrix));
    }

    @GetMapping("/users/{userId}")
    @RequiresPermission(entity = "permissions", operation = "READ")
    public ResponseEntity<ApiResponse<UserPermissionResponse>> getUserPermissions(
            @PathVariable Long userId) {
        UserPermissionResponse response = permissionService.getUserPermissions(userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<CurrentUserPermissionResponse>> getMyPermissions() {
        CurrentUserPermissionResponse response = permissionService.getMyPermissions();
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
