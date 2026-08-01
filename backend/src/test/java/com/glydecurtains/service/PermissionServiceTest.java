package com.glydecurtains.service;

import com.glydecurtains.dto.request.PermissionUpdateRequest;
import com.glydecurtains.dto.response.CurrentUserPermissionResponse;
import com.glydecurtains.dto.response.PermissionMatrixResponse;
import com.glydecurtains.dto.response.UserPermissionResponse;
import com.glydecurtains.entity.Permission;
import com.glydecurtains.entity.RolePermission;
import com.glydecurtains.entity.User;
import com.glydecurtains.entity.UserPermission;
import com.glydecurtains.entity.enums.UserRole;
import com.glydecurtains.entity.enums.UserStatus;
import com.glydecurtains.exception.BusinessException;
import com.glydecurtains.repository.PermissionRepository;
import com.glydecurtains.repository.RolePermissionRepository;
import com.glydecurtains.repository.UserPermissionRepository;
import com.glydecurtains.repository.UserRepository;
import com.glydecurtains.service.impl.PermissionServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PermissionServiceTest {

    @Mock
    private PermissionRepository permissionRepository;

    @Mock
    private RolePermissionRepository rolePermissionRepository;

    @Mock
    private UserPermissionRepository userPermissionRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private PermissionServiceImpl permissionService;

    private Permission productsReadPermission;
    private Permission productsCreatePermission;
    private Permission ordersReadPermission;

    @BeforeEach
    void setUp() {
        productsReadPermission = new Permission("products", "READ");
        productsReadPermission.setId(1L);

        productsCreatePermission = new Permission("products", "CREATE");
        productsCreatePermission.setId(2L);

        ordersReadPermission = new Permission("orders", "READ");
        ordersReadPermission.setId(3L);
    }

    @Nested
    @DisplayName("Three-Tier Permission Resolution")
    class ThreeTierResolution {

        @Test
        @DisplayName("Super Admin bypass: all permissions granted regardless of role/user settings")
        void superAdminBypass_allPermissionsGranted() {
            User superAdmin = createUser(1L, "Super Admin", UserRole.SUPER_ADMIN);

            when(userRepository.findById(1L)).thenReturn(Optional.of(superAdmin));
            when(permissionRepository.findAll()).thenReturn(List.of(productsReadPermission, productsCreatePermission, ordersReadPermission));
            when(userPermissionRepository.findByUserId(1L)).thenReturn(Collections.emptyList());
            when(rolePermissionRepository.findByRole(UserRole.SUPER_ADMIN)).thenReturn(Collections.emptyList());

            UserPermissionResponse response = permissionService.getUserPermissions(1L);

            assertNotNull(response);
            assertEquals(3, response.getPermissions().size());
            response.getPermissions().forEach(perm -> {
                assertTrue(perm.getGranted());
                assertEquals("SUPER_ADMIN_BYPASS", perm.getSource());
            });
        }

        @Test
        @DisplayName("User override takes precedence over role default")
        void userOverride_takesPrecedenceOverRoleDefault() {
            User employee = createUser(2L, "Employee User", UserRole.EMPLOYEE);

            // Role default: products READ = true
            RolePermission rolePermission = new RolePermission(UserRole.EMPLOYEE, productsReadPermission, true);
            rolePermission.setId(1L);

            // User override: products READ = false (overriding the role grant)
            UserPermission userOverride = new UserPermission(2L, productsReadPermission, false);
            userOverride.setId(1L);

            when(userRepository.findById(2L)).thenReturn(Optional.of(employee));
            when(permissionRepository.findAll()).thenReturn(List.of(productsReadPermission));
            when(userPermissionRepository.findByUserId(2L)).thenReturn(List.of(userOverride));
            when(rolePermissionRepository.findByRole(UserRole.EMPLOYEE)).thenReturn(List.of(rolePermission));

            UserPermissionResponse response = permissionService.getUserPermissions(2L);

            assertEquals(1, response.getPermissions().size());
            UserPermissionResponse.ResolvedPermission resolved = response.getPermissions().get(0);
            assertFalse(resolved.getGranted());
            assertEquals("USER_OVERRIDE", resolved.getSource());
        }

        @Test
        @DisplayName("Role default used when no user override exists")
        void roleDefault_usedWhenNoUserOverride() {
            User employee = createUser(3L, "Employee Two", UserRole.EMPLOYEE);

            RolePermission rolePermission = new RolePermission(UserRole.EMPLOYEE, productsReadPermission, true);
            rolePermission.setId(1L);

            when(userRepository.findById(3L)).thenReturn(Optional.of(employee));
            when(permissionRepository.findAll()).thenReturn(List.of(productsReadPermission));
            when(userPermissionRepository.findByUserId(3L)).thenReturn(Collections.emptyList());
            when(rolePermissionRepository.findByRole(UserRole.EMPLOYEE)).thenReturn(List.of(rolePermission));

            UserPermissionResponse response = permissionService.getUserPermissions(3L);

            assertEquals(1, response.getPermissions().size());
            UserPermissionResponse.ResolvedPermission resolved = response.getPermissions().get(0);
            assertTrue(resolved.getGranted());
            assertEquals("ROLE", resolved.getSource());
        }

        @Test
        @DisplayName("Implicit deny when no user override and no role default exist")
        void implicitDeny_whenNoOverrideAndNoRoleDefault() {
            User employee = createUser(4L, "New Employee", UserRole.EMPLOYEE);

            when(userRepository.findById(4L)).thenReturn(Optional.of(employee));
            when(permissionRepository.findAll()).thenReturn(List.of(productsReadPermission, ordersReadPermission));
            when(userPermissionRepository.findByUserId(4L)).thenReturn(Collections.emptyList());
            when(rolePermissionRepository.findByRole(UserRole.EMPLOYEE)).thenReturn(Collections.emptyList());

            UserPermissionResponse response = permissionService.getUserPermissions(4L);

            assertEquals(2, response.getPermissions().size());
            response.getPermissions().forEach(perm -> {
                assertFalse(perm.getGranted());
                assertEquals("IMPLICIT_DENY", perm.getSource());
            });
        }

        @Test
        @DisplayName("Mixed resolution: different sources for different permissions")
        void mixedResolution_differentSourcesPerPermission() {
            User employee = createUser(5L, "Mixed Employee", UserRole.EMPLOYEE);

            // Role default: products READ = true, orders READ = false
            RolePermission roleProductsRead = new RolePermission(UserRole.EMPLOYEE, productsReadPermission, true);
            roleProductsRead.setId(1L);
            RolePermission roleOrdersRead = new RolePermission(UserRole.EMPLOYEE, ordersReadPermission, false);
            roleOrdersRead.setId(2L);

            // User override: orders READ = true (override the role deny)
            UserPermission userOrdersOverride = new UserPermission(5L, ordersReadPermission, true);
            userOrdersOverride.setId(1L);

            when(userRepository.findById(5L)).thenReturn(Optional.of(employee));
            when(permissionRepository.findAll()).thenReturn(List.of(productsReadPermission, productsCreatePermission, ordersReadPermission));
            when(userPermissionRepository.findByUserId(5L)).thenReturn(List.of(userOrdersOverride));
            when(rolePermissionRepository.findByRole(UserRole.EMPLOYEE)).thenReturn(List.of(roleProductsRead, roleOrdersRead));

            UserPermissionResponse response = permissionService.getUserPermissions(5L);

            assertEquals(3, response.getPermissions().size());

            // products:READ → ROLE (true)
            UserPermissionResponse.ResolvedPermission productsRead = findPermission(response, "products", "READ");
            assertTrue(productsRead.getGranted());
            assertEquals("ROLE", productsRead.getSource());

            // products:CREATE → IMPLICIT_DENY (no role, no override)
            UserPermissionResponse.ResolvedPermission productsCreate = findPermission(response, "products", "CREATE");
            assertFalse(productsCreate.getGranted());
            assertEquals("IMPLICIT_DENY", productsCreate.getSource());

            // orders:READ → USER_OVERRIDE (true, overriding role deny)
            UserPermissionResponse.ResolvedPermission ordersRead = findPermission(response, "orders", "READ");
            assertTrue(ordersRead.getGranted());
            assertEquals("USER_OVERRIDE", ordersRead.getSource());
        }
    }

    @Nested
    @DisplayName("getUserPermissions")
    class GetUserPermissions {

        @Test
        @DisplayName("Returns user info and resolved permissions for valid user")
        void returnsUserInfoAndPermissions() {
            User user = createUser(10L, "Test User", UserRole.ADMIN);
            user.setEmail("test@glydecurtains.com");

            when(userRepository.findById(10L)).thenReturn(Optional.of(user));
            when(permissionRepository.findAll()).thenReturn(List.of(productsReadPermission));
            when(userPermissionRepository.findByUserId(10L)).thenReturn(Collections.emptyList());
            when(rolePermissionRepository.findByRole(UserRole.ADMIN)).thenReturn(Collections.emptyList());

            UserPermissionResponse response = permissionService.getUserPermissions(10L);

            assertEquals(10L, response.getUserId());
            assertEquals("Test User", response.getUserName());
            assertEquals("test@glydecurtains.com", response.getEmail());
            assertEquals(UserRole.ADMIN, response.getRole());
            assertNotNull(response.getPermissions());
        }

        @Test
        @DisplayName("Throws BusinessException when user not found")
        void throwsBusinessException_whenUserNotFound() {
            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> permissionService.getUserPermissions(999L));

            assertEquals("USER_NOT_FOUND", ex.getErrorCode());
        }
    }

    @Nested
    @DisplayName("updateUserPermissions")
    class UpdateUserPermissions {

        @Test
        @DisplayName("Creates new user permission override when none exists")
        void createsNewOverride_whenNoneExists() {
            User employee = createUser(20L, "Employee", UserRole.EMPLOYEE);
            PermissionUpdateRequest request = new PermissionUpdateRequest("products", "READ", true);

            when(userRepository.findById(20L)).thenReturn(Optional.of(employee));
            when(permissionRepository.findByEntityAndOperation("products", "READ"))
                    .thenReturn(Optional.of(productsReadPermission));
            when(userPermissionRepository.findByUserIdAndPermissionId(20L, 1L))
                    .thenReturn(Optional.empty());
            when(userPermissionRepository.save(any(UserPermission.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));
            // Mocks for getPermissionMatrix() call at end
            when(permissionRepository.findAll()).thenReturn(List.of(productsReadPermission));
            when(rolePermissionRepository.findByRole(any(UserRole.class))).thenReturn(Collections.emptyList());

            permissionService.updateUserPermissions(20L, List.of(request));

            verify(userPermissionRepository).save(any(UserPermission.class));
        }

        @Test
        @DisplayName("Updates existing user permission override")
        void updatesExistingOverride() {
            User employee = createUser(21L, "Employee", UserRole.EMPLOYEE);
            PermissionUpdateRequest request = new PermissionUpdateRequest("products", "READ", false);

            UserPermission existingOverride = new UserPermission(21L, productsReadPermission, true);
            existingOverride.setId(5L);

            when(userRepository.findById(21L)).thenReturn(Optional.of(employee));
            when(permissionRepository.findByEntityAndOperation("products", "READ"))
                    .thenReturn(Optional.of(productsReadPermission));
            when(userPermissionRepository.findByUserIdAndPermissionId(21L, 1L))
                    .thenReturn(Optional.of(existingOverride));
            when(userPermissionRepository.save(any(UserPermission.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));
            when(permissionRepository.findAll()).thenReturn(List.of(productsReadPermission));
            when(rolePermissionRepository.findByRole(any(UserRole.class))).thenReturn(Collections.emptyList());

            permissionService.updateUserPermissions(21L, List.of(request));

            assertFalse(existingOverride.getGranted());
            verify(userPermissionRepository).save(existingOverride);
        }

        @Test
        @DisplayName("Throws BusinessException when trying to set overrides for Super Admin")
        void throwsException_forSuperAdmin() {
            User superAdmin = createUser(1L, "Super Admin", UserRole.SUPER_ADMIN);
            PermissionUpdateRequest request = new PermissionUpdateRequest("products", "READ", false);

            when(userRepository.findById(1L)).thenReturn(Optional.of(superAdmin));

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> permissionService.updateUserPermissions(1L, List.of(request)));

            assertEquals("PERMISSION_DENIED", ex.getErrorCode());
        }

        @Test
        @DisplayName("Throws BusinessException when user not found")
        void throwsException_whenUserNotFound() {
            PermissionUpdateRequest request = new PermissionUpdateRequest("products", "READ", true);

            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> permissionService.updateUserPermissions(999L, List.of(request)));

            assertEquals("USER_NOT_FOUND", ex.getErrorCode());
        }

        @Test
        @DisplayName("Throws BusinessException when permission entity/operation not found")
        void throwsException_whenPermissionNotFound() {
            User employee = createUser(22L, "Employee", UserRole.EMPLOYEE);
            PermissionUpdateRequest request = new PermissionUpdateRequest("nonexistent", "READ", true);

            when(userRepository.findById(22L)).thenReturn(Optional.of(employee));
            when(permissionRepository.findByEntityAndOperation("nonexistent", "READ"))
                    .thenReturn(Optional.empty());

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> permissionService.updateUserPermissions(22L, List.of(request)));

            assertEquals("PERMISSION_NOT_FOUND", ex.getErrorCode());
        }
    }

    @Nested
    @DisplayName("updateRolePermissions")
    class UpdateRolePermissions {

        @Test
        @DisplayName("Throws BusinessException when trying to modify Super Admin role permissions")
        void throwsException_forSuperAdminRole() {
            // SUPER_ADMIN is the first role (index 0), so roleId = 1
            PermissionUpdateRequest request = new PermissionUpdateRequest("products", "READ", false);

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> permissionService.updateRolePermissions(1L, List.of(request)));

            assertEquals("PERMISSION_DENIED", ex.getErrorCode());
        }

        @Test
        @DisplayName("Creates new role permission when none exists")
        void createsNewRolePermission_whenNoneExists() {
            // ADMIN is the second role (index 1), so roleId = 2
            PermissionUpdateRequest request = new PermissionUpdateRequest("products", "READ", true);

            when(permissionRepository.findByEntityAndOperation("products", "READ"))
                    .thenReturn(Optional.of(productsReadPermission));
            when(rolePermissionRepository.findByRoleAndPermissionId(UserRole.ADMIN, 1L))
                    .thenReturn(Optional.empty());
            when(rolePermissionRepository.save(any(RolePermission.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));
            // Mocks for getPermissionMatrix() at end
            when(permissionRepository.findAll()).thenReturn(List.of(productsReadPermission));
            when(rolePermissionRepository.findByRole(any(UserRole.class))).thenReturn(Collections.emptyList());

            permissionService.updateRolePermissions(2L, List.of(request));

            verify(rolePermissionRepository).save(any(RolePermission.class));
        }

        @Test
        @DisplayName("Throws BusinessException for invalid role ID")
        void throwsException_forInvalidRoleId() {
            PermissionUpdateRequest request = new PermissionUpdateRequest("products", "READ", true);

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> permissionService.updateRolePermissions(99L, List.of(request)));

            assertEquals("INVALID_ROLE_ID", ex.getErrorCode());
        }
    }

    @Nested
    @DisplayName("getMyPermissions")
    class GetMyPermissions {

        @Test
        @DisplayName("Returns current user's resolved permissions")
        void returnsCurrentUserPermissions() {
            User currentUser = createUser(50L, "Current User", UserRole.ADMIN);
            setupSecurityContext(50L);

            when(userRepository.findById(50L)).thenReturn(Optional.of(currentUser));
            when(permissionRepository.findAll()).thenReturn(List.of(productsReadPermission));
            when(userPermissionRepository.findByUserId(50L)).thenReturn(Collections.emptyList());
            when(rolePermissionRepository.findByRole(UserRole.ADMIN)).thenReturn(Collections.emptyList());

            CurrentUserPermissionResponse response = permissionService.getMyPermissions();

            assertEquals(50L, response.getUserId());
            assertEquals(UserRole.ADMIN, response.getRole());
            assertNotNull(response.getPermissions());
            assertEquals(1, response.getPermissions().size());
        }

        @Test
        @DisplayName("Throws BusinessException when not authenticated")
        void throwsException_whenNotAuthenticated() {
            SecurityContextHolder.clearContext();

            BusinessException ex = assertThrows(BusinessException.class,
                    () -> permissionService.getMyPermissions());

            assertEquals("UNAUTHORIZED", ex.getErrorCode());
        }
    }

    // --- Helper methods ---

    private User createUser(Long id, String name, UserRole role) {
        User user = new User();
        user.setId(id);
        user.setName(name);
        user.setEmail(name.toLowerCase().replace(" ", ".") + "@glydecurtains.com");
        user.setPassword("hashedPassword");
        user.setRole(role);
        user.setStatus(UserStatus.APPROVED);
        return user;
    }

    private void setupSecurityContext(Long userId) {
        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(userId);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
    }

    private UserPermissionResponse.ResolvedPermission findPermission(
            UserPermissionResponse response, String entity, String operation) {
        return response.getPermissions().stream()
                .filter(p -> p.getEntity().equals(entity) && p.getOperation().equals(operation))
                .findFirst()
                .orElseThrow(() -> new AssertionError(
                        "Permission not found: " + entity + ":" + operation));
    }
}
