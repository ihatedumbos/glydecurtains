package com.glydecurtains.config;

import java.util.Set;

/** Real Glyde contact details (from the Glyde brand poster), used by seeders and upgrade runners. */
final class BusinessContact {

    static final String STORE_NAME = "Glyde Curtain Track & Accessories - Pune";
    static final String STORE_ADDRESS = "Shree Vinayak Furnishing, 916 Sukrawar Peth, Panghanti Chowk, Near Radhe Hotel";
    static final String CITY = "Pune";
    static final String STATE = "Maharashtra";
    static final String FULL_ADDRESS = STORE_ADDRESS + ", Pune 411042, Maharashtra, India";
    static final String PHONE = "+91 81490 66661";
    static final String EMAIL = "vishalsjain89@gmail.com";
    static final double LATITUDE = 18.5089;
    static final double LONGITUDE = 73.8611;
    static final String ANNOUNCEMENT =
            "Manufacturer-direct curtain hardware | Made in Pune | Bulk pricing for dealers & installers | PAN India delivery";

    /** Contact details from the original demo seed data, which never belonged to a real store. */
    static final Set<String> DEMO_PHONES = Set.of("+91 79 2345 6789", "+91 22 3456 7890", "+91 11 4567 8901", "+91 98765 43210");
    static final Set<String> DEMO_EMAILS = Set.of(
            "ahmedabad@glydecurtains.com", "mumbai@glydecurtains.com", "delhi@glydecurtains.com", "info@glydecurtains.com");

    private BusinessContact() {
    }
}
