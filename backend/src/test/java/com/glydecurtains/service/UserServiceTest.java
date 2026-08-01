package com.glydecurtains.service;

import com.glydecurtains.dto.request.RoleChangeRequest;
import com.glydecurtains.dto.request.UserFilterRequest;
import com.glydecurtains.dto.response.PageResponse;
import com.glydecurtains.dto.response.UserResponse;
import com.glydecurtains.entity.User;
import com.glydecurtains.entity.enums.UserRole;
import com.glydecurtains.entity.enums.UserStatus;
import com.glydecurtains.exception.BusinessException;
import com.glydecurtains.repository.ActivityLogRepository;
import com.glydecurtains.repository.RefreshTokenRepository;
import com.glydecurtains.repository.UserRepository;
import com.glydecurtains.service.impl.UserServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private ActivityLogRepository activityLogRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @InjectMocks
    private UserServiceImpl userService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setName("John Doe");
        testUser.setEmail("john@example.com");
        testUser.setPassword("encodedPassword");
        testUser.setRole(UserRole.CUSTOMER);
        testUser.setStatus(UserStatus.PENDING);
        testUser.setPreferredLanguage("en");
        testUser.setCreatedAt(LocalDateTime.now());
        testUser.setUpdatedAt(LocalDateTime.now());
    }

    // --- getUsers (paginated) ---

    @SuppressWarnings("unchecked")
    @Test
    void getUsers_withFilter_returnsPaginatedResults() {
        UserFilterRequest filter = new UserFilterRequest();
        filter.setStatus(UserStatus.APPROVED);
        Pageable pageable = PageRequest.of(0, 10);

        testUser.setStatus(UserStatus.APPROVED);
        Page<User> userPage = new PageImpl<>(List.of(testUser), pageable, 1);
        when(userRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(userPage);

        PageResponse<UserResponse> result = userService.getUsers(filter, pageable);

        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        assertEquals(1, result.getTotalElements());
        assertEquals("John Doe", result.getContent().get(0).getName());
        verify(userRepository).findAll(any(Specification.class), eq(pageable));
    }

    @SuppressWarnings("unchecked")
    @Test
    void getUsers_emptyResult_returnsEmptyPage() {
        UserFilterRequest filter = new UserFilterRequest();
        Pageable pageable = PageRequest.of(0, 10);

        Page<User> emptyPage = new PageImpl<>(List.of(), pageable, 0);
        when(userRepository.findAll(any(Specification.class), eq(pageable))).thenReturn(emptyPage);

        PageResponse<UserResponse> result = userService.getUsers(filter, pageable);

        assertNotNull(result);
        assertTrue(result.getContent().isEmpty());
        assertEquals(0, result.getTotalElements());
    }

    // --- getUserById ---

    @Test
    void getUserById_existingUser_returnsUserResponse() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        UserResponse result = userService.getUserById(1L);

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("John Doe", result.getName());
        assertEquals("john@example.com", result.getEmail());
        assertEquals(UserRole.CUSTOMER, result.getRole());
    }

    @Test
    void getUserById_notFound_throwsBusinessException() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        BusinessException ex = assertThrows(BusinessException.class,
                () -> userService.getUserById(99L));

        assertEquals("USER_NOT_FOUND", ex.getErrorCode());
        assertTrue(ex.getMessage().contains("99"));
    }

    // --- approveUser ---

    @Test
    void approveUser_pendingUser_setsStatusApproved() {
        setupSecurityContext();
        testUser.setStatus(UserStatus.PENDING);
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(activityLogRepository.save(any())).thenReturn(null);

        UserResponse result = userService.approveUser(1L);

        assertEquals(UserStatus.APPROVED, result.getStatus());
        verify(userRepository).save(testUser);
        verify(activityLogRepository).save(any());
    }

    @Test
    void approveUser_nonPendingUser_throwsBusinessException() {
        testUser.setStatus(UserStatus.APPROVED);
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        BusinessException ex = assertThrows(BusinessException.class,
                () -> userService.approveUser(1L));

        assertEquals("INVALID_STATUS_TRANSITION", ex.getErrorCode());
    }

    // --- rejectUser ---

    @Test
    void rejectUser_pendingUser_setsStatusRejected() {
        setupSecurityContext();
        testUser.setStatus(UserStatus.PENDING);
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(activityLogRepository.save(any())).thenReturn(null);

        UserResponse result = userService.rejectUser(1L);

        assertEquals(UserStatus.REJECTED, result.getStatus());
        verify(userRepository).save(testUser);
    }

    @Test
    void rejectUser_approvedUser_throwsBusinessException() {
        testUser.setStatus(UserStatus.APPROVED);
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        BusinessException ex = assertThrows(BusinessException.class,
                () -> userService.rejectUser(1L));

        assertEquals("INVALID_STATUS_TRANSITION", ex.getErrorCode());
    }

    // --- suspendUser ---

    @Test
    void suspendUser_approvedUser_setsStatusSuspendedAndInvalidatesSessions() {
        setupSecurityContext();
        testUser.setStatus(UserStatus.APPROVED);
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(activityLogRepository.save(any())).thenReturn(null);

        UserResponse result = userService.suspendUser(1L);

        assertEquals(UserStatus.SUSPENDED, result.getStatus());
        verify(refreshTokenRepository).deleteByUser_Id(1L);
        verify(activityLogRepository).save(any());
    }

    @Test
    void suspendUser_pendingUser_throwsBusinessException() {
        testUser.setStatus(UserStatus.PENDING);
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        BusinessException ex = assertThrows(BusinessException.class,
                () -> userService.suspendUser(1L));

        assertEquals("INVALID_STATUS_TRANSITION", ex.getErrorCode());
    }

    // --- changeRole ---

    @Test
    void changeRole_validUser_updatesRole() {
        setupSecurityContext();
        testUser.setStatus(UserStatus.APPROVED);
        testUser.setRole(UserRole.CUSTOMER);
        RoleChangeRequest request = new RoleChangeRequest(UserRole.EMPLOYEE);
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(activityLogRepository.save(any())).thenReturn(null);

        UserResponse result = userService.changeRole(1L, request);

        assertEquals(UserRole.EMPLOYEE, result.getRole());
        verify(userRepository).save(testUser);
    }

    @Test
    void changeRole_superAdmin_throwsBusinessException() {
        testUser.setRole(UserRole.SUPER_ADMIN);
        RoleChangeRequest request = new RoleChangeRequest(UserRole.ADMIN);
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));

        BusinessException ex = assertThrows(BusinessException.class,
                () -> userService.changeRole(1L, request));

        assertEquals("ROLE_CHANGE_DENIED", ex.getErrorCode());
    }

    // --- resetUserPassword ---

    @Test
    void resetUserPassword_existingUser_resetsPasswordAndInvalidatesSessions() {
        setupSecurityContext();
        when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
        when(passwordEncoder.encode(anyString())).thenReturn("newEncodedPassword");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(activityLogRepository.save(any())).thenReturn(null);

        userService.resetUserPassword(1L);

        verify(passwordEncoder).encode(anyString());
        verify(userRepository).save(testUser);
        verify(refreshTokenRepository).deleteByUser_Id(1L);
        assertNotNull(testUser.getPasswordChangedAt());
    }

    // --- Helper ---

    private void setupSecurityContext() {
        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(100L);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
    }
}
