package com.glydecurtains.service.impl;

import com.glydecurtains.dto.request.RoleChangeRequest;
import com.glydecurtains.dto.request.UserFilterRequest;
import com.glydecurtains.dto.response.PageResponse;
import com.glydecurtains.dto.response.UserResponse;
import com.glydecurtains.entity.ActivityLog;
import com.glydecurtains.entity.User;
import com.glydecurtains.entity.enums.UserRole;
import com.glydecurtains.entity.enums.UserStatus;
import com.glydecurtains.exception.BusinessException;
import com.glydecurtains.repository.ActivityLogRepository;
import com.glydecurtains.repository.RefreshTokenRepository;
import com.glydecurtains.repository.UserRepository;
import com.glydecurtains.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@Transactional
public class UserServiceImpl implements UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserServiceImpl.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ActivityLogRepository activityLogRepository;
    private final RefreshTokenRepository refreshTokenRepository;

    public UserServiceImpl(UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           ActivityLogRepository activityLogRepository,
                           RefreshTokenRepository refreshTokenRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.activityLogRepository = activityLogRepository;
        this.refreshTokenRepository = refreshTokenRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<UserResponse> getUsers(UserFilterRequest filter, Pageable pageable) {
        Specification<User> spec = buildSpecification(filter);
        Page<User> userPage = userRepository.findAll(spec, pageable);
        Page<UserResponse> responsePage = userPage.map(this::toUserResponse);
        return PageResponse.from(responsePage);
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getUserById(Long userId) {
        User user = findUserOrThrow(userId);
        return toUserResponse(user);
    }

    @Override
    public UserResponse approveUser(Long userId) {
        User user = findUserOrThrow(userId);

        if (user.getStatus() != UserStatus.PENDING) {
            throw new BusinessException(
                    "Only users with PENDING status can be approved",
                    "INVALID_STATUS_TRANSITION",
                    HttpStatus.BAD_REQUEST);
        }

        UserStatus previousStatus = user.getStatus();
        user.setStatus(UserStatus.APPROVED);
        User saved = userRepository.save(user);

        persistAuditLog(userId, "STATUS_CHANGE", "USER", userId,
                String.format("{\"fromStatus\":\"%s\",\"toStatus\":\"%s\",\"action\":\"approve\"}", previousStatus, UserStatus.APPROVED));

        return toUserResponse(saved);
    }

    @Override
    public UserResponse rejectUser(Long userId) {
        User user = findUserOrThrow(userId);

        if (user.getStatus() != UserStatus.PENDING) {
            throw new BusinessException(
                    "Only users with PENDING status can be rejected",
                    "INVALID_STATUS_TRANSITION",
                    HttpStatus.BAD_REQUEST);
        }

        UserStatus previousStatus = user.getStatus();
        user.setStatus(UserStatus.REJECTED);
        User saved = userRepository.save(user);

        persistAuditLog(userId, "STATUS_CHANGE", "USER", userId,
                String.format("{\"fromStatus\":\"%s\",\"toStatus\":\"%s\",\"action\":\"reject\"}", previousStatus, UserStatus.REJECTED));

        return toUserResponse(saved);
    }

    @Override
    public UserResponse suspendUser(Long userId) {
        User user = findUserOrThrow(userId);

        if (user.getStatus() != UserStatus.APPROVED) {
            throw new BusinessException(
                    "Only users with APPROVED status can be suspended",
                    "INVALID_STATUS_TRANSITION",
                    HttpStatus.BAD_REQUEST);
        }

        UserStatus previousStatus = user.getStatus();
        user.setStatus(UserStatus.SUSPENDED);
        User saved = userRepository.save(user);

        // Invalidate all active sessions for the suspended user (Requirement 1.7)
        refreshTokenRepository.deleteByUser_Id(userId);

        persistAuditLog(userId, "STATUS_CHANGE", "USER", userId,
                String.format("{\"fromStatus\":\"%s\",\"toStatus\":\"%s\",\"action\":\"suspend\",\"sessionsInvalidated\":true}", previousStatus, UserStatus.SUSPENDED));

        return toUserResponse(saved);
    }

    @Override
    public UserResponse activateUser(Long userId) {
        User user = findUserOrThrow(userId);

        if (user.getStatus() != UserStatus.SUSPENDED && user.getStatus() != UserStatus.DEACTIVATED) {
            throw new BusinessException(
                    "Only users with SUSPENDED or DEACTIVATED status can be activated",
                    "INVALID_STATUS_TRANSITION",
                    HttpStatus.BAD_REQUEST);
        }

        UserStatus previousStatus = user.getStatus();
        user.setStatus(UserStatus.APPROVED);
        User saved = userRepository.save(user);

        persistAuditLog(userId, "STATUS_CHANGE", "USER", userId,
                String.format("{\"fromStatus\":\"%s\",\"toStatus\":\"%s\",\"action\":\"activate\"}", previousStatus, UserStatus.APPROVED));

        return toUserResponse(saved);
    }

    @Override
    public UserResponse deactivateUser(Long userId) {
        User user = findUserOrThrow(userId);

        if (user.getStatus() == UserStatus.DEACTIVATED) {
            throw new BusinessException(
                    "User is already deactivated",
                    "INVALID_STATUS_TRANSITION",
                    HttpStatus.BAD_REQUEST);
        }

        UserStatus previousStatus = user.getStatus();
        user.setStatus(UserStatus.DEACTIVATED);
        User saved = userRepository.save(user);

        // Invalidate sessions for deactivated user
        refreshTokenRepository.deleteByUser_Id(userId);

        persistAuditLog(userId, "STATUS_CHANGE", "USER", userId,
                String.format("{\"fromStatus\":\"%s\",\"toStatus\":\"%s\",\"action\":\"deactivate\",\"sessionsInvalidated\":true}", previousStatus, UserStatus.DEACTIVATED));

        return toUserResponse(saved);
    }

    @Override
    public UserResponse changeRole(Long userId, RoleChangeRequest request) {
        User user = findUserOrThrow(userId);
        UserRole previousRole = user.getRole();

        if (user.getRole() == UserRole.SUPER_ADMIN) {
            throw new BusinessException(
                    "Cannot change the role of a Super Admin",
                    "ROLE_CHANGE_DENIED",
                    HttpStatus.FORBIDDEN);
        }

        user.setRole(request.getRole());
        User saved = userRepository.save(user);

        persistAuditLog(userId, "ROLE_CHANGE", "USER", userId,
                String.format("{\"fromRole\":\"%s\",\"toRole\":\"%s\"}", previousRole, request.getRole()));

        return toUserResponse(saved);
    }

    @Override
    public void resetUserPassword(Long userId) {
        User user = findUserOrThrow(userId);

        // Generate a temporary password
        String temporaryPassword = UUID.randomUUID().toString().substring(0, 12);
        user.setPassword(passwordEncoder.encode(temporaryPassword));
        user.setPasswordChangedAt(LocalDateTime.now());
        userRepository.save(user);

        // Invalidate all existing sessions (Requirement 15.5)
        refreshTokenRepository.deleteByUser_Id(userId);

        persistAuditLog(userId, "PASSWORD_RESET", "USER", userId,
                "{\"action\":\"admin_password_reset\",\"sessionsInvalidated\":true}");

        // In Phase 1, no email service — password is reset server-side
        logger.info("Password reset for user {}. Temporary password generated.", userId);
    }

    // --- Helper methods ---

    private User findUserOrThrow(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(
                        "User not found with id: " + userId,
                        "USER_NOT_FOUND",
                        HttpStatus.NOT_FOUND));
    }

    private Specification<User> buildSpecification(UserFilterRequest filter) {
        Specification<User> spec = Specification.where(null);

        if (filter == null) {
            return spec;
        }

        if (filter.getName() != null && !filter.getName().isBlank()) {
            spec = spec.and((root, query, cb) ->
                    cb.like(cb.lower(root.get("name")), "%" + filter.getName().toLowerCase() + "%"));
        }

        if (filter.getEmail() != null && !filter.getEmail().isBlank()) {
            spec = spec.and((root, query, cb) ->
                    cb.like(cb.lower(root.get("email")), "%" + filter.getEmail().toLowerCase() + "%"));
        }

        if (filter.getStatus() != null) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("status"), filter.getStatus()));
        }

        if (filter.getRole() != null) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("role"), filter.getRole()));
        }

        if (filter.getFromDate() != null) {
            spec = spec.and((root, query, cb) ->
                    cb.greaterThanOrEqualTo(root.get("createdAt"), filter.getFromDate().atStartOfDay()));
        }

        if (filter.getToDate() != null) {
            spec = spec.and((root, query, cb) ->
                    cb.lessThanOrEqualTo(root.get("createdAt"), filter.getToDate().plusDays(1).atStartOfDay()));
        }

        return spec;
    }

    private UserResponse toUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .status(user.getStatus())
                .preferredLanguage(user.getPreferredLanguage())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    private void persistAuditLog(Long targetUserId, String actionType, String entityType, Long entityId, String details) {
        Long actorId = getCurrentUserId();

        ActivityLog log = ActivityLog.builder()
                .userId(actorId)
                .actionType(actionType)
                .entityType(entityType)
                .entityId(entityId)
                .details(details)
                .timestamp(LocalDateTime.now())
                .build();

        activityLogRepository.save(log);

        logger.info("AUDIT: Action {} on {} id={} by user {}. Details: {}",
                actionType, entityType, entityId, actorId, details);
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Long) {
            return (Long) authentication.getPrincipal();
        }
        return null;
    }
}
