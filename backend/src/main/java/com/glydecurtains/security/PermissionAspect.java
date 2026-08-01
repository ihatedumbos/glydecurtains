package com.glydecurtains.security;

import com.glydecurtains.entity.enums.UserRole;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * AOP Aspect that intercepts methods annotated with {@link RequiresPermission}
 * and delegates the permission check to {@link PermissionEvaluator}.
 *
 * Extracts userId (principal) and role (authority) from the SecurityContext,
 * which are set by the JwtAuthenticationFilter.
 */
@Aspect
@Component
public class PermissionAspect {

    private static final Logger logger = LoggerFactory.getLogger(PermissionAspect.class);
    private static final String ROLE_PREFIX = "ROLE_";

    private final PermissionEvaluator permissionEvaluator;

    public PermissionAspect(PermissionEvaluator permissionEvaluator) {
        this.permissionEvaluator = permissionEvaluator;
    }

    @Around("@annotation(requiresPermission)")
    public Object checkPermission(ProceedingJoinPoint joinPoint, RequiresPermission requiresPermission) throws Throwable {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("User is not authenticated");
        }

        Long userId = extractUserId(authentication);
        UserRole userRole = extractUserRole(authentication);
        String entity = requiresPermission.entity();
        String operation = requiresPermission.operation();

        logger.debug("Checking permission: userId={}, role={}, entity={}, operation={}",
                userId, userRole, entity, operation);

        if (!permissionEvaluator.hasPermission(userId, userRole, entity, operation)) {
            logger.warn("Access denied: userId={}, role={}, entity={}, operation={}",
                    userId, userRole, entity, operation);
            throw new AccessDeniedException(
                    String.format("Access denied: insufficient permissions for %s %s", operation, entity));
        }

        return joinPoint.proceed();
    }

    private Long extractUserId(Authentication authentication) {
        Object principal = authentication.getPrincipal();
        if (principal instanceof Long) {
            return (Long) principal;
        }
        if (principal instanceof String) {
            try {
                return Long.parseLong((String) principal);
            } catch (NumberFormatException e) {
                throw new AccessDeniedException("Invalid user principal in security context");
            }
        }
        throw new AccessDeniedException("Unable to extract user ID from security context");
    }

    private UserRole extractUserRole(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(auth -> auth.startsWith(ROLE_PREFIX))
                .map(auth -> auth.substring(ROLE_PREFIX.length()))
                .findFirst()
                .map(UserRole::valueOf)
                .orElseThrow(() -> new AccessDeniedException("Unable to extract user role from security context"));
    }
}
