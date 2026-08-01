package com.glydecurtains.service.impl;

import com.glydecurtains.dto.request.PermissionUpdateRequest;
import com.glydecurtains.dto.response.CurrentUserPermissionResponse;
import com.glydecurtains.dto.response.PermissionMatrixResponse;
import com.glydecurtains.dto.response.UserPermissionResponse;
import com.glydecurtains.entity.Permission;
import com.glydecurtains.entity.RolePermission;
import com.glydecurtains.entity.User;
import com.glydecurtains.entity.UserPermission;
import com.glydecurtains.entity.enums.UserRole;
import com.glydecurtains.exception.BusinessException;
import com.glydecurtains.repository.PermissionRepository;
import com.glydecurtains.repository.RolePermissionRepository;
import com.glydecurtains.repository.UserPermissionRepository;
import com.glydecurtains.repository.UserRepository;
import com.glydecurtains.service.PermissionService;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class PermissionServiceImpl implements PermissionService {

    private final PermissionRepository permissionRepository;
    private final RolePermissionRepository rolePermissionRepository;
    private final UserPermissionRepository userPermissionRepository;
    private final UserRepository userRepository;

    public PermissionServiceImpl(PermissionRepository permissionRepository,
                                 RolePermissionRepository rolePermissionRepository,
                                 UserPermissionRepository userPermissionRepository,
                                 UserRepository userRepository) {
        this.permissionRepository = permissionRepository;
        this.rolePermissionRepository = rolePermissionRepository;
        this.userPermissionRepository = userPermissionRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public PermissionMatrixResponse getPermissionMatrix() {
        List<Permission> allPermissions = permissionRepository.findAll();

        List<String> entities = allPermissions.stream()
                .map(Permission::getEntity)
                .distinct()
                .sorted()
                .collect(Collectors.toList());

        List<String> operations = allPermissions.stream()
                .map(Permission::getOperation)
                .distinct()
                .sorted()
                .collect(Collectors.toList());

        Map<String, List<PermissionMatrixResponse.RolePermissionEntry>> matrix = new LinkedHashMap<>();

        for (UserRole role : UserRole.values()) {
            List<RolePermission> rolePermissions = rolePermissionRepository.findByRole(role);

            Map<String, Boolean> grantMap = rolePermissions.stream()
                    .collect(Collectors.toMap(
                            rp -> rp.getPermission().getEntity() + ":" + rp.getPermission().getOperation(),
                            RolePermission::getGranted,
                            (existing, replacement) -> replacement
                    ));

            List<PermissionMatrixResponse.RolePermissionEntry> entries = new ArrayList<>();
            for (Permission perm : allPermissions) {
                String key = perm.getEntity() + ":" + perm.getOperation();
                Boolean granted = grantMap.getOrDefault(key, false);
                entries.add(PermissionMatrixResponse.RolePermissionEntry.builder()
                        .entity(perm.getEntity())
                        .operation(perm.getOperation())
                        .granted(granted)
                        .build());
            }

            matrix.put(role.name(), entries);
        }

        return PermissionMatrixResponse.builder()
                .entities(entities)
                .operations(operations)
                .matrix(matrix)
                .build();
    }

    @Override
    public PermissionMatrixResponse updateRolePermissions(Long roleId, List<PermissionUpdateRequest> permissions) {
        UserRole role = resolveRole(roleId);

        if (role == UserRole.SUPER_ADMIN) {
            throw new BusinessException(
                    "Cannot modify Super Admin permissions",
                    "PERMISSION_DENIED",
                    HttpStatus.FORBIDDEN);
        }

        for (PermissionUpdateRequest request : permissions) {
            Permission permission = permissionRepository
                    .findByEntityAndOperation(request.getEntity(), request.getOperation())
                    .orElseThrow(() -> new BusinessException(
                            "Permission not found: " + request.getEntity() + ":" + request.getOperation(),
                            "PERMISSION_NOT_FOUND",
                            HttpStatus.NOT_FOUND));

            Optional<RolePermission> existingRp = rolePermissionRepository
                    .findByRoleAndPermissionId(role, permission.getId());

            if (existingRp.isPresent()) {
                existingRp.get().setGranted(request.getGranted());
                rolePermissionRepository.save(existingRp.get());
            } else {
                RolePermission rp = new RolePermission(role, permission, request.getGranted());
                rolePermissionRepository.save(rp);
            }
        }

        return getPermissionMatrix();
    }

    @Override
    public PermissionMatrixResponse updateUserPermissions(Long userId, List<PermissionUpdateRequest> permissions) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(
                        "User not found with id: " + userId,
                        "USER_NOT_FOUND",
                        HttpStatus.NOT_FOUND));

        if (user.getRole() == UserRole.SUPER_ADMIN) {
            throw new BusinessException(
                    "Cannot set overrides for Super Admin users",
                    "PERMISSION_DENIED",
                    HttpStatus.FORBIDDEN);
        }

        for (PermissionUpdateRequest request : permissions) {
            Permission permission = permissionRepository
                    .findByEntityAndOperation(request.getEntity(), request.getOperation())
                    .orElseThrow(() -> new BusinessException(
                            "Permission not found: " + request.getEntity() + ":" + request.getOperation(),
                            "PERMISSION_NOT_FOUND",
                            HttpStatus.NOT_FOUND));

            Optional<UserPermission> existingUp = userPermissionRepository
                    .findByUserIdAndPermissionId(userId, permission.getId());

            if (existingUp.isPresent()) {
                existingUp.get().setGranted(request.getGranted());
                userPermissionRepository.save(existingUp.get());
            } else {
                UserPermission up = new UserPermission(userId, permission, request.getGranted());
                userPermissionRepository.save(up);
            }
        }

        return getPermissionMatrix();
    }

    @Override
    @Transactional(readOnly = true)
    public UserPermissionResponse getUserPermissions(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(
                        "User not found with id: " + userId,
                        "USER_NOT_FOUND",
                        HttpStatus.NOT_FOUND));

        List<UserPermissionResponse.ResolvedPermission> resolvedPermissions = resolvePermissions(userId, user.getRole());

        return UserPermissionResponse.builder()
                .userId(user.getId())
                .userName(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .permissions(resolvedPermissions)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public CurrentUserPermissionResponse getMyPermissions() {
        Long currentUserId = getCurrentUserId();
        if (currentUserId == null) {
            throw new BusinessException(
                    "Not authenticated",
                    "UNAUTHORIZED",
                    HttpStatus.UNAUTHORIZED);
        }

        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new BusinessException(
                        "Current user not found",
                        "USER_NOT_FOUND",
                        HttpStatus.NOT_FOUND));

        List<UserPermissionResponse.ResolvedPermission> resolved = resolvePermissions(currentUserId, user.getRole());

        List<CurrentUserPermissionResponse.PermissionGrant> grants = resolved.stream()
                .map(rp -> CurrentUserPermissionResponse.PermissionGrant.builder()
                        .entity(rp.getEntity())
                        .operation(rp.getOperation())
                        .granted(rp.getGranted())
                        .build())
                .collect(Collectors.toList());

        return CurrentUserPermissionResponse.builder()
                .userId(user.getId())
                .role(user.getRole())
                .permissions(grants)
                .build();
    }

    // --- Helper methods ---

    private List<UserPermissionResponse.ResolvedPermission> resolvePermissions(Long userId, UserRole role) {
        List<Permission> allPermissions = permissionRepository.findAll();
        List<UserPermission> userOverrides = userPermissionRepository.findByUserId(userId);
        List<RolePermission> roleDefaults = rolePermissionRepository.findByRole(role);

        Map<String, UserPermission> userOverrideMap = userOverrides.stream()
                .collect(Collectors.toMap(
                        up -> up.getPermission().getEntity() + ":" + up.getPermission().getOperation(),
                        up -> up,
                        (existing, replacement) -> replacement
                ));

        Map<String, RolePermission> roleDefaultMap = roleDefaults.stream()
                .collect(Collectors.toMap(
                        rp -> rp.getPermission().getEntity() + ":" + rp.getPermission().getOperation(),
                        rp -> rp,
                        (existing, replacement) -> replacement
                ));

        List<UserPermissionResponse.ResolvedPermission> resolved = new ArrayList<>();

        for (Permission perm : allPermissions) {
            String key = perm.getEntity() + ":" + perm.getOperation();

            if (role == UserRole.SUPER_ADMIN) {
                resolved.add(UserPermissionResponse.ResolvedPermission.builder()
                        .entity(perm.getEntity())
                        .operation(perm.getOperation())
                        .granted(true)
                        .source("SUPER_ADMIN_BYPASS")
                        .build());
            } else if (userOverrideMap.containsKey(key)) {
                resolved.add(UserPermissionResponse.ResolvedPermission.builder()
                        .entity(perm.getEntity())
                        .operation(perm.getOperation())
                        .granted(userOverrideMap.get(key).getGranted())
                        .source("USER_OVERRIDE")
                        .build());
            } else if (roleDefaultMap.containsKey(key)) {
                resolved.add(UserPermissionResponse.ResolvedPermission.builder()
                        .entity(perm.getEntity())
                        .operation(perm.getOperation())
                        .granted(roleDefaultMap.get(key).getGranted())
                        .source("ROLE")
                        .build());
            } else {
                resolved.add(UserPermissionResponse.ResolvedPermission.builder()
                        .entity(perm.getEntity())
                        .operation(perm.getOperation())
                        .granted(false)
                        .source("IMPLICIT_DENY")
                        .build());
            }
        }

        return resolved;
    }

    private UserRole resolveRole(Long roleId) {
        UserRole[] roles = UserRole.values();
        if (roleId < 1 || roleId > roles.length) {
            throw new BusinessException(
                    "Invalid role ID: " + roleId + ". Valid IDs are 1-" + roles.length,
                    "INVALID_ROLE_ID",
                    HttpStatus.BAD_REQUEST);
        }
        return roles[roleId.intValue() - 1];
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Long) {
            return (Long) authentication.getPrincipal();
        }
        return null;
    }
}
