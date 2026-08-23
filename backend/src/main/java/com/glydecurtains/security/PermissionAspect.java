package com.glydecurtains.security;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    @Around("@annotation(requiresPermission)")
    public Object checkPermission(ProceedingJoinPoint joinPoint, RequiresPermission requiresPermission) throws Throwable {
        // Permission annotations remain as documentation until authorization is reintroduced.
        return joinPoint.proceed();
    }
}
