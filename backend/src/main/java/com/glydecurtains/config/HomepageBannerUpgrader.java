package com.glydecurtains.config;

import com.glydecurtains.entity.Banner;
import com.glydecurtains.entity.HomepageSection;
import com.glydecurtains.entity.enums.SectionType;
import com.glydecurtains.repository.BannerRepository;
import com.glydecurtains.repository.HomepageSectionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Older databases were seeded with hero banners whose image is a 1x1 placeholder JPEG
 * (raw base64) and generic retail copy ("Summer Sale - Up to 30% Off"). DataSeeder skips
 * databases that already have users, so those banners never got replaced. This runner swaps
 * them for banners that use real catalogue photos, and leaves any banner an admin uploaded alone.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class HomepageBannerUpgrader implements ApplicationRunner {

    /** Real uploaded photos are far larger than this; the seeded placeholders are ~380 chars. */
    private static final int PLACEHOLDER_MAX_LENGTH = 1024;

    private final HomepageSectionRepository homepageSectionRepository;
    private final BannerRepository bannerRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        HomepageSection hero = homepageSectionRepository.findBySectionType(SectionType.HERO_BANNER).orElse(null);
        if (hero == null) {
            return;
        }
        List<Banner> banners = bannerRepository.findBySectionIdOrderBySortOrderAsc(hero.getId());
        List<Banner> placeholders = banners.stream().filter(HomepageBannerUpgrader::isPlaceholder).toList();
        if (placeholders.isEmpty()) {
            return;
        }
        bannerRepository.deleteAll(placeholders);
        if (placeholders.size() == banners.size()) {
            save(hero, "Manufacturer-Direct Curtain Hardware",
                    "Precision track runners and fittings, made in Pune",
                    "/products/accessories/hero/hero-runners.jpg", "View Products", "/products", 1);
            save(hero, "Bulk Pricing for Dealers & Installers",
                    "Direct supply and support for trade orders across India",
                    "/products/accessories/hero/hero-hardware.jpg", "Contact Us", "/contact", 2);
        }
        log.info("Replaced {} placeholder hero banner(s) with catalogue photos.", placeholders.size());
    }

    static boolean isPlaceholder(Banner banner) {
        String image = banner.getImageBase64();
        if (image == null || image.isBlank()) {
            return true;
        }
        String trimmed = image.trim();
        boolean isPath = trimmed.startsWith("/") && trimmed.matches("^/[\\w\\-./# %()]+\\.(?i)(jpe?g|png|webp|gif|avif)$");
        return !isPath && !trimmed.startsWith("http") && trimmed.length() <= PLACEHOLDER_MAX_LENGTH;
    }

    private void save(HomepageSection section, String title, String subtitle, String image,
                      String buttonText, String buttonLink, int sortOrder) {
        Banner banner = new Banner();
        banner.setSection(section);
        banner.setTitle(title);
        banner.setSubtitle(subtitle);
        banner.setImageBase64(image);
        banner.setButtonText(buttonText);
        banner.setButtonLink(buttonLink);
        banner.setSortOrder(sortOrder);
        banner.setIsActive(true);
        bannerRepository.save(banner);
    }
}
