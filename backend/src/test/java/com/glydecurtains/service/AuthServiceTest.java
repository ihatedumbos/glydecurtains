package com.glydecurtains.service;

import com.glydecurtains.dto.request.LoginRequest;
import com.glydecurtains.dto.request.RefreshTokenRequest;
import com.glydecurtains.dto.request.RegisterRequest;
import com.glydecurtains.dto.response.AuthResponse;
import com.glydecurtains.entity.RefreshToken;
import com.glydecurtains.entity.User;
import com.glydecurtains.entity.enums.UserRole;
import com.glydecurtains.entity.enums.UserStatus;
import com.glydecurtains.exception.BusinessException;
import com.glydecurtains.repository.PasswordResetTokenRepository;
import com.glydecurtains.repository.RefreshTokenRepository;
import com.glydecurtains.repository.UserRepository;
import com.glydecurtains.security.JwtTokenProvider;
import com.glydecurtains.service.impl.AuthServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private ActivityLogService activityLogService;

    @InjectMocks
    private AuthServiceImpl authService;

    private User approvedUser;
    private User pendingUser;

    @BeforeEach
    void setUp() {
        approvedUser = new User();
        approvedUser.setId(1L);
        approvedUser.setName("John Doe");
        approvedUser.setEmail("john@example.com");
        approvedUser.setPassword("encoded_password");
        approvedUser.setRole(UserRole.CUSTOMER);
        approvedUser.setStatus(UserStatus.APPROVED);
        approvedUser.setRememberMe(false);

        pendingUser = new User();
        pendingUser.setId(2L);
        pendingUser.setName("Jane Smith");
        pendingUser.setEmail("jane@example.com");
        pendingUser.setPassword("encoded_password");
        pendingUser.setRole(UserRole.CUSTOMER);
        pendingUser.setStatus(UserStatus.PENDING);
        pendingUser.setRememberMe(false);
    }

    @Nested
    @DisplayName("Login Tests")
    class LoginTests {

        @Test
        @DisplayName("Should login successfully with valid credentials and approved user")
        void loginSuccess_withValidCredentials() {
            LoginRequest request = LoginRequest.builder()
                    .email("john@example.com")
                    .password("Password1!")
                    .rememberMe(false)
                    .build();

            when(userRepository.findByEmailIgnoreCase("john@example.com"))
                    .thenReturn(Optional.of(approvedUser));
            when(passwordEncoder.matches("Password1!", "encoded_password"))
                    .thenReturn(true);
            when(jwtTokenProvider.generateAccessToken(1L, "john@example.com", "CUSTOMER"))
                    .thenReturn("access_token_123");
            when(jwtTokenProvider.generateRefreshToken(1L, false))
                    .thenReturn("refresh_token_123");
            when(jwtTokenProvider.getRefreshTokenExpirationMs())
                    .thenReturn(86400000L); // 24 hours
            when(jwtTokenProvider.getAccessTokenExpirationMs())
                    .thenReturn(900000L); // 15 minutes
            when(refreshTokenRepository.save(any(RefreshToken.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            AuthResponse response = authService.login(request);

            assertThat(response.getAccessToken()).isEqualTo("access_token_123");
            assertThat(response.getRefreshToken()).isEqualTo("refresh_token_123");
            assertThat(response.getTokenType()).isEqualTo("Bearer");
            assertThat(response.getExpiresIn()).isEqualTo(900L);
            assertThat(response.getUser().getId()).isEqualTo(1L);
            assertThat(response.getUser().getEmail()).isEqualTo("john@example.com");
            assertThat(response.getUser().getRole()).isEqualTo("CUSTOMER");
            assertThat(response.getUser().getStatus()).isEqualTo("APPROVED");

            verify(refreshTokenRepository).save(any(RefreshToken.class));
            verify(activityLogService).log(eq(1L), eq("USER_LOGIN"), eq("USER"), eq(1L), anyString());
        }

        @Test
        @DisplayName("Should throw BusinessException with invalid password")
        void loginFails_withInvalidPassword() {
            LoginRequest request = LoginRequest.builder()
                    .email("john@example.com")
                    .password("WrongPassword1!")
                    .rememberMe(false)
                    .build();

            when(userRepository.findByEmailIgnoreCase("john@example.com"))
                    .thenReturn(Optional.of(approvedUser));
            when(passwordEncoder.matches("WrongPassword1!", "encoded_password"))
                    .thenReturn(false);

            assertThatThrownBy(() -> authService.login(request))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> {
                        BusinessException bex = (BusinessException) ex;
                        assertThat(bex.getErrorCode()).isEqualTo("INVALID_CREDENTIALS");
                        assertThat(bex.getHttpStatus()).isEqualTo(HttpStatus.UNAUTHORIZED);
                    });

            verify(refreshTokenRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw BusinessException when user does not exist")
        void loginFails_withNonExistentUser() {
            LoginRequest request = LoginRequest.builder()
                    .email("nonexistent@example.com")
                    .password("Password1!")
                    .rememberMe(false)
                    .build();

            when(userRepository.findByEmailIgnoreCase("nonexistent@example.com"))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.login(request))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> {
                        BusinessException bex = (BusinessException) ex;
                        assertThat(bex.getErrorCode()).isEqualTo("INVALID_CREDENTIALS");
                        assertThat(bex.getHttpStatus()).isEqualTo(HttpStatus.UNAUTHORIZED);
                    });

            verify(refreshTokenRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw BusinessException when user status is PENDING")
        void loginFails_withPendingUser() {
            LoginRequest request = LoginRequest.builder()
                    .email("jane@example.com")
                    .password("Password1!")
                    .rememberMe(false)
                    .build();

            when(userRepository.findByEmailIgnoreCase("jane@example.com"))
                    .thenReturn(Optional.of(pendingUser));
            when(passwordEncoder.matches("Password1!", "encoded_password"))
                    .thenReturn(true);

            assertThatThrownBy(() -> authService.login(request))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> {
                        BusinessException bex = (BusinessException) ex;
                        assertThat(bex.getErrorCode()).isEqualTo("ACCOUNT_PENDING");
                        assertThat(bex.getHttpStatus()).isEqualTo(HttpStatus.FORBIDDEN);
                    });
        }

        @Test
        @DisplayName("Should throw BusinessException when user status is SUSPENDED")
        void loginFails_withSuspendedUser() {
            User suspendedUser = new User();
            suspendedUser.setId(3L);
            suspendedUser.setName("Suspended User");
            suspendedUser.setEmail("suspended@example.com");
            suspendedUser.setPassword("encoded_password");
            suspendedUser.setRole(UserRole.CUSTOMER);
            suspendedUser.setStatus(UserStatus.SUSPENDED);

            LoginRequest request = LoginRequest.builder()
                    .email("suspended@example.com")
                    .password("Password1!")
                    .rememberMe(false)
                    .build();

            when(userRepository.findByEmailIgnoreCase("suspended@example.com"))
                    .thenReturn(Optional.of(suspendedUser));
            when(passwordEncoder.matches("Password1!", "encoded_password"))
                    .thenReturn(true);

            assertThatThrownBy(() -> authService.login(request))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> {
                        BusinessException bex = (BusinessException) ex;
                        assertThat(bex.getErrorCode()).isEqualTo("ACCOUNT_SUSPENDED");
                        assertThat(bex.getHttpStatus()).isEqualTo(HttpStatus.FORBIDDEN);
                    });
        }

        @Test
        @DisplayName("Should throw BusinessException when user status is REJECTED")
        void loginFails_withRejectedUser() {
            User rejectedUser = new User();
            rejectedUser.setId(4L);
            rejectedUser.setName("Rejected User");
            rejectedUser.setEmail("rejected@example.com");
            rejectedUser.setPassword("encoded_password");
            rejectedUser.setRole(UserRole.CUSTOMER);
            rejectedUser.setStatus(UserStatus.REJECTED);

            LoginRequest request = LoginRequest.builder()
                    .email("rejected@example.com")
                    .password("Password1!")
                    .rememberMe(false)
                    .build();

            when(userRepository.findByEmailIgnoreCase("rejected@example.com"))
                    .thenReturn(Optional.of(rejectedUser));
            when(passwordEncoder.matches("Password1!", "encoded_password"))
                    .thenReturn(true);

            assertThatThrownBy(() -> authService.login(request))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> {
                        BusinessException bex = (BusinessException) ex;
                        assertThat(bex.getErrorCode()).isEqualTo("ACCOUNT_REJECTED");
                        assertThat(bex.getHttpStatus()).isEqualTo(HttpStatus.FORBIDDEN);
                    });
        }
    }

    @Nested
    @DisplayName("Register Tests")
    class RegisterTests {

        @Test
        @DisplayName("Should register successfully with valid data")
        void registerSuccess() {
            RegisterRequest request = RegisterRequest.builder()
                    .name("New User")
                    .email("newuser@example.com")
                    .password("StrongPass1!")
                    .build();

            when(userRepository.existsByEmailIgnoreCase("newuser@example.com"))
                    .thenReturn(false);
            when(passwordEncoder.encode("StrongPass1!"))
                    .thenReturn("encoded_strong_pass");
            when(userRepository.save(any(User.class)))
                    .thenAnswer(invocation -> {
                        User saved = invocation.getArgument(0);
                        saved.setId(10L);
                        return saved;
                    });

            AuthResponse response = authService.register(request);

            assertThat(response.getUser().getName()).isEqualTo("New User");
            assertThat(response.getUser().getEmail()).isEqualTo("newuser@example.com");
            assertThat(response.getUser().getStatus()).isEqualTo("PENDING");
            assertThat(response.getUser().getRole()).isEqualTo("CUSTOMER");
            assertThat(response.getAccessToken()).isNull();
            assertThat(response.getExpiresIn()).isEqualTo(0);

            verify(userRepository).save(argThat(user ->
                    user.getStatus() == UserStatus.PENDING &&
                    user.getRole() == UserRole.CUSTOMER &&
                    user.getPassword().equals("encoded_strong_pass")
            ));
            verify(activityLogService).log(eq(10L), eq("USER_REGISTERED"), eq("USER"), eq(10L), anyString());
        }

        @Test
        @DisplayName("Should throw BusinessException when email already exists")
        void registerFails_withDuplicateEmail() {
            RegisterRequest request = RegisterRequest.builder()
                    .name("Duplicate User")
                    .email("john@example.com")
                    .password("StrongPass1!")
                    .build();

            when(userRepository.existsByEmailIgnoreCase("john@example.com"))
                    .thenReturn(true);

            assertThatThrownBy(() -> authService.register(request))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> {
                        BusinessException bex = (BusinessException) ex;
                        assertThat(bex.getErrorCode()).isEqualTo("DUPLICATE_EMAIL");
                        assertThat(bex.getHttpStatus()).isEqualTo(HttpStatus.CONFLICT);
                    });

            verify(userRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw BusinessException when password is weak")
        void registerFails_withWeakPassword() {
            RegisterRequest request = RegisterRequest.builder()
                    .name("Weak Pass User")
                    .email("weakpass@example.com")
                    .password("weak")
                    .build();

            assertThatThrownBy(() -> authService.register(request))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> {
                        BusinessException bex = (BusinessException) ex;
                        assertThat(bex.getErrorCode()).isEqualTo("WEAK_PASSWORD");
                        assertThat(bex.getHttpStatus()).isEqualTo(HttpStatus.BAD_REQUEST);
                    });

            verify(userRepository, never()).existsByEmailIgnoreCase(any());
            verify(userRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("Token Refresh Tests")
    class TokenRefreshTests {

        @Test
        @DisplayName("Should refresh token successfully with valid refresh token")
        void refreshTokenSuccess() {
            RefreshTokenRequest request = RefreshTokenRequest.builder()
                    .refreshToken("valid_refresh_token")
                    .build();

            RefreshToken storedToken = new RefreshToken();
            storedToken.setId(1L);
            storedToken.setToken("valid_refresh_token");
            storedToken.setUser(approvedUser);
            storedToken.setExpiryDate(LocalDateTime.now().plusHours(24));

            when(jwtTokenProvider.validateToken("valid_refresh_token"))
                    .thenReturn(true);
            when(refreshTokenRepository.findByToken("valid_refresh_token"))
                    .thenReturn(Optional.of(storedToken));
            when(jwtTokenProvider.generateAccessToken(1L, "john@example.com", "CUSTOMER"))
                    .thenReturn("new_access_token");
            when(jwtTokenProvider.getAccessTokenExpirationMs())
                    .thenReturn(900000L);

            AuthResponse response = authService.refreshToken(request);

            assertThat(response.getAccessToken()).isEqualTo("new_access_token");
            assertThat(response.getRefreshToken()).isEqualTo("valid_refresh_token");
            assertThat(response.getTokenType()).isEqualTo("Bearer");
            assertThat(response.getExpiresIn()).isEqualTo(900L);
            assertThat(response.getUser().getId()).isEqualTo(1L);
        }

        @Test
        @DisplayName("Should throw BusinessException when refresh token is invalid (JWT validation fails)")
        void refreshTokenFails_withInvalidToken() {
            RefreshTokenRequest request = RefreshTokenRequest.builder()
                    .refreshToken("invalid_token")
                    .build();

            when(jwtTokenProvider.validateToken("invalid_token"))
                    .thenReturn(false);

            assertThatThrownBy(() -> authService.refreshToken(request))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> {
                        BusinessException bex = (BusinessException) ex;
                        assertThat(bex.getErrorCode()).isEqualTo("INVALID_REFRESH_TOKEN");
                        assertThat(bex.getHttpStatus()).isEqualTo(HttpStatus.UNAUTHORIZED);
                    });
        }

        @Test
        @DisplayName("Should throw BusinessException when refresh token is expired in database")
        void refreshTokenFails_withExpiredToken() {
            RefreshTokenRequest request = RefreshTokenRequest.builder()
                    .refreshToken("expired_refresh_token")
                    .build();

            RefreshToken expiredToken = new RefreshToken();
            expiredToken.setId(2L);
            expiredToken.setToken("expired_refresh_token");
            expiredToken.setUser(approvedUser);
            expiredToken.setExpiryDate(LocalDateTime.now().minusHours(1)); // expired

            when(jwtTokenProvider.validateToken("expired_refresh_token"))
                    .thenReturn(true);
            when(refreshTokenRepository.findByToken("expired_refresh_token"))
                    .thenReturn(Optional.of(expiredToken));

            assertThatThrownBy(() -> authService.refreshToken(request))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> {
                        BusinessException bex = (BusinessException) ex;
                        assertThat(bex.getErrorCode()).isEqualTo("REFRESH_TOKEN_EXPIRED");
                        assertThat(bex.getHttpStatus()).isEqualTo(HttpStatus.UNAUTHORIZED);
                    });

            verify(refreshTokenRepository).delete(expiredToken);
        }

        @Test
        @DisplayName("Should throw BusinessException when refresh token not found in database")
        void refreshTokenFails_whenNotFoundInDb() {
            RefreshTokenRequest request = RefreshTokenRequest.builder()
                    .refreshToken("not_in_db_token")
                    .build();

            when(jwtTokenProvider.validateToken("not_in_db_token"))
                    .thenReturn(true);
            when(refreshTokenRepository.findByToken("not_in_db_token"))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.refreshToken(request))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> {
                        BusinessException bex = (BusinessException) ex;
                        assertThat(bex.getErrorCode()).isEqualTo("INVALID_REFRESH_TOKEN");
                        assertThat(bex.getHttpStatus()).isEqualTo(HttpStatus.UNAUTHORIZED);
                    });
        }
    }
}
