package com.glydecurtains.security;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;

class RateLimitFilterTest {

    private final RateLimitFilter filter = new RateLimitFilter();

    private int login(String ip, int statusFromApp) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/login");
        request.setServletPath("/api/auth/login");
        request.addHeader("X-Forwarded-For", ip);
        MockHttpServletResponse response = new MockHttpServletResponse();
        HttpServlet app = new HttpServlet() {
            @Override
            protected void service(HttpServletRequest req, HttpServletResponse res) {
                res.setStatus(statusFromApp);
            }
        };
        filter.doFilter(request, response, new MockFilterChain(app));
        return response.getStatus();
    }

    @Test
    void successfulLoginsAreNeverLimited() throws Exception {
        for (int i = 0; i < 50; i++) {
            assertThat(login("1.1.1.1", 200)).isEqualTo(200);
        }
    }

    @Test
    void blocksAfterTwentyFailedAttempts() throws Exception {
        for (int i = 0; i < 20; i++) {
            assertThat(login("2.2.2.2", 401)).isEqualTo(401);
        }
        assertThat(login("2.2.2.2", 200)).isEqualTo(429);
        // Another visitor is unaffected.
        assertThat(login("3.3.3.3", 200)).isEqualTo(200);
    }
}
