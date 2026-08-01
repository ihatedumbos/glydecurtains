package com.glydecurtains.security;

import com.glydecurtains.entity.RolePermission;
import com.glydecurtains.entity.UserPermission;
import com.glydecurtains.entity.enums.UserRole;
import com.glydecurtains.repository.RolePermissionRepository;
import com.glydecurtains.repository.UserPermissionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Evaluates whether a user has permission to perform a specific operation on an entity.
 * 
 * Resolution order (three-tier):
 * 1. If user role is SUPER_ADMIN → grant all access (bypass)
 * 2. Check UserPermission for specific user + permission → if found, use its granted value
 * 3. Check RolePermission for user's role + permission → if found, use its granted value
 * 4. Otherwise → implicit deny (return false)
 */
@Component
public class PermissionEvaluator {

    private static final Logger logger = LoggerFactory.getLogger(PermissionEvaluator.class);

    private final UserPermissionRepository userPermissionRepository;
    private final RolePermissionRepository rolePermissionRepository;

    public PermissionEvaluator(UserPermissionRepository userPermissionRepository,
                               RolePermissionRepository rolePermissionRepository) {
        this.userPermissionRepository = userPermissionRepository;
        this.rolePermissionRepository = rolePermissionRepository;
    }

    /**
     * Evaluates permission for a given user, role, entity, and operation.
     *
     * @param userId    the authenticated user's ID
     * @param userRole  the authenticated user's role
     * @param entity    the entity being accessed (e.g., "products")
     * @param operation the operation being performed (e.g., "CREATE")
     * @return true if access is granted, false otherwise
     */
    public boolean hasPermission(Long userId, UserRole userRole, String entity, String operation) {
        // Tier 1: Super Admin bypass — always grant access
        if (userRole == UserRole.SUPER_ADMIN) {
            logger.debug("SUPER_ADMIN bypass: userId={}, entity={}, operation={}", userId, entity, operation);
            return true;
        }

        // Tier 2: Check user-level permission override
        Optional<UserPermission> userPermission = userPermissionRepository
                .findByUserIdAndPermission_EntityAndPermission_Operation(userId, entity, operation);

        if (userPermission.isPresent()) {
            boolean granted = userPermission.get().getGranted();
            logger.debug("User permission found: userId={}, entity={}, operation={}, granted={}",
                    userId, entity, operation, granted);
            return granted;
        }

        // Tier 3: Check role-level permission default
        Optional<RolePermission> rolePermission = rolePermissionRepository
                .findByRoleAndPermission_EntityAndPermission_Operation(userRole, entity, operation);

        if (rolePermission.isPresent()) {
            boolean granted = rolePermission.get().getGranted();
            logger.debug("Role permission found: role={}, entity={}, operation={}, granted={}",
                    userRole, entity, operation, granted);
            return granted;
        }

        // Tier 4: Implicit deny
        logger.debug("Implicit deny: userId={}, role={}, entity={}, operation={}",
                userId, userRole, entity, operation);
        return false;
    }
}
