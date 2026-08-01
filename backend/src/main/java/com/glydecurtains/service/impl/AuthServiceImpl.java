package com.glydecurtains.service.impl;

import com.glydecurtains.dto.request.*;
import com.glydecurtains.dto.response.AuthResponse;
import com.glydecurtains.entity.PasswordResetToken;
import com.glydecurtains.entity.RefreshToken;
import com.glydecurtains.entity.User;
import com.glydecurtains.entity.enums.UserRole;
import com.glydecurtains.entity.enums.UserStatus;
import com.glydecurtains.exception.BusinessException;
import com.glydecurtains.repository.PasswordResetTokenRepository;
import com.glydecurtains.repository.RefreshTokenRepository;
import com.glydecurtains.repository.UserRepository;
import com.glydecurtains.security.JwtTokenProvider;
import com.glydecurtains.service.ActivityLogService;
import com.glydecurtains.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private static final Pattern PASSWORD_PATTERN = Pattern.compile(
            "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&^#()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/~`])[A-Za-z\\d@$!%*?&^#()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/~`]{8,}$"
    );

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final long LOCKOUT_DURATION_MS = 15 * 60 * 1000L; // 15 minutes

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final ActivityLogService activityLogService;

    // Track failed login attempts per user email (case-insensitive)
    private final ConcurrentHashMap<String, List<Long>> failedLoginAttempts = new ConcurrentHashMap<>();

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Validate password strength
        validatePasswordStrength(request.getPassword());

        // Check duplicate email (case-insensitive)
        if (userRepository.existsByEmailIgnoreCase(request.getEmail())) {
            throw new BusinessException(
                    "An account with this email already exists",
                    "DUPLICATE_EMAIL",
                    HttpStatus.CONFLICT
            );
        }

        // Create user with PENDING status
        User user = new User();
        user.setName(request.getName().trim());
        user.setEmail(request.getEmail().trim().toLowerCase());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(UserRole.CUSTOMER);
        user.setStatus(UserStatus.PENDING);
        user.setRememberMe(false);

        user = userRepository.save(user);

        log.info("New user registered: {} ({})", user.getName(), user.getEmail());
        activityLogService.log(user.getId(), "USER_REGISTERED", "USER", user.getId(),
                String.format("{\"email\":\"%s\",\"role\":\"%s\"}", user.getEmail(), user.getRole()));

        // Return response without tokens (user is PENDING, can't login yet)
        return AuthResponse.builder()
                .tokenType("Bearer")
                .expiresIn(0)
                .user(mapUserToSummary(user))
                .build();
    }

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request) {
        String emailLower = request.getEmail().trim().toLowerCase();

        // Check if user account is locked due to failed attempts
        if (isAccountLocked(emailLower)) {
            throw new BusinessException(
                    "Account is temporarily locked due to too many failed login attempts. Please try again after 15 minutes.",
                    "ACCOUNT_LOCKED",
                    HttpStatus.TOO_MANY_REQUESTS
            );
        }

        // Find user by email
        Optional<User> optionalUser = userRepository.findByEmailIgnoreCase(emailLower);
        if (optionalUser.isEmpty()) {
            recordFailedAttempt(emailLower);
            throw new BusinessException(
                    "Invalid email or password",
                    "INVALID_CREDENTIALS",
                    HttpStatus.UNAUTHORIZED
            );
        }

        User user = optionalUser.get();

        // Validate password
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            recordFailedAttempt(emailLower);
            throw new BusinessException(
                    "Invalid email or password",
                    "INVALID_CREDENTIALS",
                    HttpStatus.UNAUTHORIZED
            );
        }

        // Check user status
        switch (user.getStatus()) {
            case PENDING:
                throw new BusinessException(
                        "Your account is pending approval. Please wait for an administrator to approve your registration.",
                        "ACCOUNT_PENDING",
                        HttpStatus.FORBIDDEN
                );
            case REJECTED:
                throw new BusinessException(
                        "Your account has been rejected. Please contact support for more information.",
                        "ACCOUNT_REJECTED",
                        HttpStatus.FORBIDDEN
                );
            case SUSPENDED:
                throw new BusinessException(
                        "Your account has been suspended. Please contact support for more information.",
                        "ACCOUNT_SUSPENDED",
                        HttpStatus.FORBIDDEN
                );
            case DEACTIVATED:
                throw new BusinessException(
                        "Your account has been deactivated. Please contact support for more information.",
                        "ACCOUNT_DEACTIVATED",
                        HttpStatus.FORBIDDEN
                );
            case APPROVED:
                // Proceed with login
                break;
        }

        // Clear failed attempts on successful login
        clearFailedAttempts(emailLower);

        // Generate tokens
        String accessToken = jwtTokenProvider.generateAccessToken(
                user.getId(), user.getEmail(), user.getRole().name()
        );
        String refreshTokenStr = jwtTokenProvider.generateRefreshToken(
                user.getId(), request.isRememberMe()
        );

        // Persist refresh token
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setToken(refreshTokenStr);
        refreshToken.setUser(user);
        long expirationMs = request.isRememberMe()
                ? jwtTokenProvider.getRememberMeExpirationMs()
                : jwtTokenProvider.getRefreshTokenExpirationMs();
        refreshToken.setExpiryDate(LocalDateTime.now().plusSeconds(expirationMs / 1000));
        refreshTokenRepository.save(refreshToken);

        log.info("User logged in: {} ({})", user.getName(), user.getEmail());
        activityLogService.log(user.getId(), "USER_LOGIN", "USER", user.getId(),
                String.format("{\"email\":\"%s\",\"rememberMe\":%s}", user.getEmail(), request.isRememberMe()));

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshTokenStr)
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getAccessTokenExpirationMs() / 1000)
                .user(mapUserToSummary(user))
                .build();
    }

    @Override
    @Transactional
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String tokenStr = request.getRefreshToken();

        // Validate JWT signature/expiry
        if (!jwtTokenProvider.validateToken(tokenStr)) {
            throw new BusinessException(
                    "Invalid or expired refresh token",
                    "INVALID_REFRESH_TOKEN",
                    HttpStatus.UNAUTHORIZED
            );
        }

        // Find refresh token in database
        RefreshToken storedToken = refreshTokenRepository.findByToken(tokenStr)
                .orElseThrow(() -> new BusinessException(
                        "Invalid or expired refresh token",
                        "INVALID_REFRESH_TOKEN",
                        HttpStatus.UNAUTHORIZED
                ));

        // Check if token is expired
        if (storedToken.isExpired()) {
            refreshTokenRepository.delete(storedToken);
            throw new BusinessException(
                    "Refresh token has expired",
                    "REFRESH_TOKEN_EXPIRED",
                    HttpStatus.UNAUTHORIZED
            );
        }

        // Get user
        User user = storedToken.getUser();

        // Generate new access token
        String newAccessToken = jwtTokenProvider.generateAccessToken(
                user.getId(), user.getEmail(), user.getRole().name()
        );

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(tokenStr)
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getAccessTokenExpirationMs() / 1000)
                .user(mapUserToSummary(user))
                .build();
    }

    @Override
    @Transactional
    public void logout(String refreshToken) {
        refreshTokenRepository.findByToken(refreshToken)
                .ifPresent(token -> {
                    Long userId = token.getUser().getId();
                    refreshTokenRepository.delete(token);
                    activityLogService.log(userId, "USER_LOGOUT", "USER", userId, "{\"action\":\"logout\"}");
                });
        log.info("User logged out, refresh token invalidated");
    }

    @Override
    @Transactional
    public void requestPasswordReset(String email) {
        // Always return success regardless of whether email exists (security best practice)
        Optional<User> optionalUser = userRepository.findByEmailIgnoreCase(email.trim().toLowerCase());

        if (optionalUser.isPresent()) {
            User user = optionalUser.get();

            // Generate a unique reset token
            String token = UUID.randomUUID().toString();

            // Create password reset token (valid for 15 minutes)
            PasswordResetToken resetToken = new PasswordResetToken();
            resetToken.setToken(token);
            resetToken.setUser(user);
            resetToken.setExpiryDate(LocalDateTime.now().plusMinutes(15));
            resetToken.setUsed(false);

            passwordResetTokenRepository.save(resetToken);

            log.info("Password reset token generated for user: {}", user.getEmail());
            // In Phase 1, no email service is available.
            // The token would be sent via email in future phases.
            // For now, it's stored in the database and can be retrieved via H2 console.
        }

        // Generic success regardless of email existence
        log.info("Password reset requested for email: {}", email);
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        // Find token
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(request.getToken())
                .orElseThrow(() -> new BusinessException(
                        "Invalid or expired password reset token",
                        "INVALID_RESET_TOKEN",
                        HttpStatus.BAD_REQUEST
                ));

        // Validate token
        if (!resetToken.isValid()) {
            throw new BusinessException(
                    "Invalid or expired password reset token",
                    "INVALID_RESET_TOKEN",
                    HttpStatus.BAD_REQUEST
            );
        }

        // Validate new password strength
        validatePasswordStrength(request.getNewPassword());

        // Update password
        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setPasswordChangedAt(LocalDateTime.now());
        userRepository.save(user);

        // Invalidate the reset token
        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        // Invalidate all refresh tokens for this user (invalidate sessions)
        refreshTokenRepository.deleteByUser_Id(user.getId());

        log.info("Password reset successful for user: {}", user.getEmail());
        activityLogService.log(user.getId(), "PASSWORD_RESET", "USER", user.getId(),
                "{\"action\":\"password_reset_via_token\"}");
    }

    @Override
    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(
                        "User not found",
                        "USER_NOT_FOUND",
                        HttpStatus.NOT_FOUND
                ));

        // Validate current password
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BusinessException(
                    "Current password is incorrect",
                    "INVALID_CURRENT_PASSWORD",
                    HttpStatus.BAD_REQUEST
            );
        }

        // Validate new password strength
        validatePasswordStrength(request.getNewPassword());

        // Update password
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setPasswordChangedAt(LocalDateTime.now());
        userRepository.save(user);

        // Invalidate all refresh tokens (force re-login)
        refreshTokenRepository.deleteByUser_Id(user.getId());

        log.info("Password changed for user: {}", user.getEmail());
        activityLogService.log(userId, "PASSWORD_CHANGE", "USER", userId,
                "{\"action\":\"password_changed_by_user\"}");
    }

    // --- Private helper methods ---

    private void validatePasswordStrength(String password) {
        if (password == null || !PASSWORD_PATTERN.matcher(password).matches()) {
            throw new BusinessException(
                    "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character",
                    "WEAK_PASSWORD",
                    HttpStatus.BAD_REQUEST
            );
        }
    }

    private boolean isAccountLocked(String email) {
        List<Long> attempts = failedLoginAttempts.get(email);
        if (attempts == null || attempts.isEmpty()) {
            return false;
        }

        long cutoff = System.currentTimeMillis() - LOCKOUT_DURATION_MS;
        long recentAttempts = attempts.stream()
                .filter(timestamp -> timestamp > cutoff)
                .count();

        return recentAttempts >= MAX_FAILED_ATTEMPTS;
    }

    private void recordFailedAttempt(String email) {
        failedLoginAttempts.computeIfAbsent(email, k -> new CopyOnWriteArrayList<>())
                .add(System.currentTimeMillis());

        // Cleanup old entries
        List<Long> attempts = failedLoginAttempts.get(email);
        if (attempts != null) {
            long cutoff = System.currentTimeMillis() - LOCKOUT_DURATION_MS;
            attempts.removeIf(timestamp -> timestamp <= cutoff);
        }
    }

    private void clearFailedAttempts(String email) {
        failedLoginAttempts.remove(email);
    }

    private AuthResponse.UserSummaryResponse mapUserToSummary(User user) {
        return AuthResponse.UserSummaryResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .status(user.getStatus().name())
                .build();
    }
}
