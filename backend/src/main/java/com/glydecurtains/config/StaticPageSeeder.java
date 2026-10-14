package com.glydecurtains.config;

import com.glydecurtains.entity.StaticPage;
import com.glydecurtains.entity.enums.PageType;
import com.glydecurtains.repository.StaticPageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Creates the About, Privacy and Terms pages the footer links to when they don't exist yet,
 * so those links never land on "Page not found". Pages already in the database (for example
 * edited from the admin CMS screen) are left untouched.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class StaticPageSeeder implements ApplicationRunner {

    private final StaticPageRepository staticPageRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        createIfMissing("about-us", "About Us", PageType.ABOUT_US, """
                <p>Glyde Curtain Track &amp; Accessories manufactures curtain track runners, ceiling and wall \
                fittings, end caps and curtain tapes in Pune, Maharashtra.</p>
                <p>Our hardware is built for smooth, silent sliding and long life, and is used by homeowners, \
                interior designers, installers and furnishing dealers across India.</p>
                <h3>Dealers and bulk orders</h3>
                <p>We supply dealers and installers directly, with bulk pricing and PAN India delivery. \
                Custom sizes and finishes are available on request.</p>
                <h3>Visit or reach us</h3>
                <p>Shree Vinayak Furnishing, 916 Sukrawar Peth, Panghanti Chowk, near Radhe Hotel, \
                Pune 411042, Maharashtra.<br/>WhatsApp: +91 81490 66661<br/>Email: vishalsjain89@gmail.com</p>
                """);
        createIfMissing("privacy-policy", "Privacy Policy", PageType.PRIVACY_POLICY, """
                <p>This website is a product catalogue. We do not take payments or online orders on it.</p>
                <p>If you send us an enquiry through the contact form or WhatsApp, we use your name, phone \
                number, email and message only to reply to you about our products. We do not sell or share \
                these details with third parties.</p>
                <p>To ask us to delete your details, contact vishalsjain89@gmail.com.</p>
                """);
        createIfMissing("terms-and-conditions", "Terms & Conditions", PageType.TERMS, """
                <p>Product photos, descriptions and prices on this website are for reference and may change \
                without notice. Final prices, availability and delivery terms are confirmed when you place an \
                order with us directly over WhatsApp, phone or email.</p>
                <p>All content and images on this website belong to Glyde Curtain Track &amp; Accessories and \
                may not be reused without permission.</p>
                """);
    }

    private void createIfMissing(String slug, String title, PageType type, String content) {
        if (staticPageRepository.findBySlug(slug).isPresent()) {
            return;
        }
        StaticPage page = new StaticPage();
        page.setSlug(slug);
        page.setTitle(title);
        page.setPageType(type);
        page.setContent(content.strip());
        page.setIsVisible(true);
        staticPageRepository.save(page);
        log.info("Created default '{}' page.", slug);
    }
}
