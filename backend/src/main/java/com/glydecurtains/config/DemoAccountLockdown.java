package com.glydecurtains.config;

import com.glydecurtains.entity.User;
import com.glydecurtains.entity.enums.UserRole;
import com.glydecurtains.entity.enums.UserStatus;
import com.glydecurtains.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

/**
 * Closes the logins whose passwords are published in the repository, for databases seeded before
 * demo data was switched off in production: admins still on the demo password get ADMIN_PASSWORD
 * (or a random one, logged once), and demo staff/customer logins are deactivated.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DemoAccountLockdown implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.password:}")
    private String adminPassword;

    @Value("${app.seed-demo-data:true}")
    private boolean demoDataAllowed;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        boolean hasConfiguredPassword = adminPassword != null && !adminPassword.isBlank();
        for (User user : userRepository.findAll()) {
            if (user.getRole() == UserRole.SUPER_ADMIN
                    && passwordEncoder.matches(DemoAccounts.DEMO_ADMIN_PASSWORD, user.getPassword())) {
                if (hasConfiguredPassword) {
                    user.setPassword(passwordEncoder.encode(adminPassword));
                    log.info("Admin {} now uses ADMIN_PASSWORD instead of the demo password.", user.getEmail());
                } else if (!demoDataAllowed) {
                    String generated = DemoAccounts.randomPassword();
                    user.setPassword(passwordEncoder.encode(generated));
                    log.warn("Admin {} was on the published demo password. New password: {} "
                            + "(set ADMIN_PASSWORD so it stays the same after redeploys)", user.getEmail(), generated);
                }
                continue;
            }
            if (demoDataAllowed || user.getStatus() == UserStatus.DEACTIVATED) {
                continue;
            }
            String demoPassword = demoLogins().get(user.getEmail() == null ? "" : user.getEmail().toLowerCase());
            if (demoPassword != null && passwordEncoder.matches(demoPassword, user.getPassword())) {
                user.setStatus(UserStatus.DEACTIVATED);
                log.info("Deactivated demo login {}.", user.getEmail());
            }
        }
    }

    private static Map<String, String> demoLogins() {
        return DemoAccounts.logins();
    }
}
