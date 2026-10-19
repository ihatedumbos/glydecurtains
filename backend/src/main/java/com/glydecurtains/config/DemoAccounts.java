package com.glydecurtains.config;

import java.security.SecureRandom;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Logins created by the demo seed data, with the passwords published in the repository.
 * They must never work on the live site.
 */
final class DemoAccounts {

    static final String DEMO_ADMIN_PASSWORD = "admin123";

    private static final String PASSWORD_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private DemoAccounts() {
    }

    /** Demo login email to its published password. */
    static Map<String, String> logins() {
        Map<String, String> logins = new LinkedHashMap<>();
        logins.put("dk@glydecurtains.com", "dk");
        for (int i = 1; i <= 4; i++) {
            logins.put("emp" + i + "@glydecurtains.com", "emp123");
        }
        for (String name : new String[] {"nisha", "rohan", "aarav"}) {
            logins.put(name + "@glydecurtains.com", "emp123");
        }
        for (int i = 1; i <= 10; i++) {
            logins.put("samplecustomer" + i + "@glydecurtains.com", "demo123");
        }
        return logins;
    }

    static String randomPassword() {
        StringBuilder password = new StringBuilder();
        for (int i = 0; i < 16; i++) {
            password.append(PASSWORD_CHARS.charAt(RANDOM.nextInt(PASSWORD_CHARS.length())));
        }
        return password.toString();
    }
}
