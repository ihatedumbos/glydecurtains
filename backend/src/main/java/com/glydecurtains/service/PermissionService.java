package com.glydecurtains.service;

import com.glydecurtains.dto.request.PermissionUpdateRequest;
import com.glydecurtains.dto.response.CurrentUserPermissionResponse;
import com.glydecurtains.dto.response.PermissionMatrixResponse;
import com.glydecurtains.dto.response.UserPermissionResponse;

import java.util.List;

public interface PermissionService {

    PermissionMatrixResponse getPermissionMatrix();

    PermissionMatrixResponse updateRolePermissions(Long roleId, List<PermissionUpdateRequest> permissions);

    PermissionMatrixResponse updateUserPermissions(Long userId, List<PermissionUpdateRequest> permissions);

    UserPermissionResponse getUserPermissions(Long userId);

    CurrentUserPermissionResponse getMyPermissions();
}
