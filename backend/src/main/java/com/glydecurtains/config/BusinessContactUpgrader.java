package com.glydecurtains.config;

import com.glydecurtains.entity.SiteSettings;
import com.glydecurtains.entity.StoreLocation;
import com.glydecurtains.repository.SiteSettingsRepository;
import com.glydecurtains.repository.StoreLocationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Older databases were seeded with made-up showrooms (Ahmedabad, Mumbai, Delhi) and dummy site
 * contact details. Replace those with the real Pune store, phone and email. Anything an admin
 * entered by hand (any value not in the demo set) is left alone.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class BusinessContactUpgrader implements ApplicationRunner {

    private final StoreLocationRepository storeLocationRepository;
    private final SiteSettingsRepository siteSettingsRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        replaceDemoStores();
        replaceDemoSiteSettings();
    }

    private void replaceDemoStores() {
        List<StoreLocation> stores = storeLocationRepository.findAll();
        List<StoreLocation> demoStores = stores.stream()
                .filter(store -> BusinessContact.DEMO_PHONES.contains(store.getPhone())
                        || BusinessContact.DEMO_EMAILS.contains(store.getEmail()))
                .toList();
        if (!demoStores.isEmpty()) {
            storeLocationRepository.deleteAll(demoStores);
            log.info("Removed {} demo store location(s).", demoStores.size());
        }
        boolean hasRealStore = stores.stream()
                .filter(store -> !demoStores.contains(store))
                .anyMatch(store -> BusinessContact.STORE_NAME.equalsIgnoreCase(store.getName()));
        if (!hasRealStore) {
            storeLocationRepository.save(realStore());
            log.info("Added the Pune store location.");
        }
    }

    static StoreLocation realStore() {
        StoreLocation store = new StoreLocation();
        store.setName(BusinessContact.STORE_NAME);
        store.setAddress(BusinessContact.STORE_ADDRESS);
        store.setCity(BusinessContact.CITY);
        store.setState(BusinessContact.STATE);
        store.setPhone(BusinessContact.PHONE);
        store.setEmail(BusinessContact.EMAIL);
        store.setLatitude(BusinessContact.LATITUDE);
        store.setLongitude(BusinessContact.LONGITUDE);
        store.setIsActive(true);
        return store;
    }

    private void replaceDemoSiteSettings() {
        for (SiteSettings settings : siteSettingsRepository.findAll()) {
            boolean changed = false;
            if (settings.getContactPhone() == null || BusinessContact.DEMO_PHONES.contains(settings.getContactPhone())) {
                settings.setContactPhone(BusinessContact.PHONE);
                changed = true;
            }
            if (settings.getContactEmail() == null || BusinessContact.DEMO_EMAILS.contains(settings.getContactEmail())) {
                settings.setContactEmail(BusinessContact.EMAIL);
                changed = true;
            }
            if (settings.getAddress() == null || settings.getAddress().contains("S.G. Highway")) {
                settings.setAddress(BusinessContact.FULL_ADDRESS);
                changed = true;
            }
            String announcement = settings.getAnnouncementBar();
            if (announcement == null || announcement.contains("Free shipping") || announcement.contains("WELCOME10")) {
                settings.setAnnouncementBar(BusinessContact.ANNOUNCEMENT);
                changed = true;
            }
            // The seed data invented social pages (facebook.com/glydecurtains etc.) that aren't Glyde's.
            if (settings.getSocialLinks() != null && settings.getSocialLinks().contains("pinterest.com/glydecurtains")) {
                settings.setSocialLinks("{}");
                changed = true;
            }
            if (changed) {
                siteSettingsRepository.save(settings);
                log.info("Replaced demo site contact details with the real ones.");
            }
        }
    }
}
