package com.glydecurtains.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Iterator;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(RateLimitFilter.class);
    private static final String LOGIN_PATH = "/api/auth/login";
    private static final int MAX_ATTEMPTS = 5;
    private static final long WINDOW_MS = 15 * 60 * 1000L; // 15 minutes

    private final ConcurrentHashMap<String, List<Long>> attemptsByIp = new ConcurrentHashMap<>();

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !LOGIN_PATH.equals(request.getServletPath());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String clientIp = getClientIp(request);

        if (isRateLimited(clientIp)) {
            logger.warn("Rate limit exceeded for IP: {}", clientIp);
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write(
                    "{\"status\":429,\"message\":\"Too many login attempts. Please try again after 15 minutes.\",\"timestamp\":\""
                            + java.time.LocalDateTime.now() + "\"}"
            );
            return;
        }

        recordAttempt(clientIp);
        filterChain.doFilter(request, response);
    }

    private boolean isRateLimited(String clientIp) {
        List<Long> attempts = attemptsByIp.get(clientIp);
        if (attempts == null) {
            return false;
        }

        long cutoff = System.currentTimeMillis() - WINDOW_MS;
        long recentAttempts = attempts.stream()
                .filter(timestamp -> timestamp > cutoff)
                .count();

        return recentAttempts >= MAX_ATTEMPTS;
    }

    private void recordAttempt(String clientIp) {
        attemptsByIp.computeIfAbsent(clientIp, k -> new CopyOnWriteArrayList<>())
                .add(System.currentTimeMillis());

        // Cleanup old entries for this IP
        cleanupExpiredEntries(clientIp);
    }

    private void cleanupExpiredEntries(String clientIp) {
        List<Long> attempts = attemptsByIp.get(clientIp);
        if (attempts != null) {
            long cutoff = System.currentTimeMillis() - WINDOW_MS;
            attempts.removeIf(timestamp -> timestamp <= cutoff);

            if (attempts.isEmpty()) {
                attemptsByIp.remove(clientIp);
            }
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        return request.getRemoteAddr();
    }

    // For testing purposes
    void clearAttempts() {
        attemptsByIp.clear();
    }
}
