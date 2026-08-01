package com.glydecurtains.service.impl;

import com.glydecurtains.dto.request.*;
import com.glydecurtains.dto.response.*;
import com.glydecurtains.entity.Banner;
import com.glydecurtains.entity.HomepageSection;
import com.glydecurtains.entity.SiteSettings;
import com.glydecurtains.entity.StaticPage;
import com.glydecurtains.exception.BusinessException;
import com.glydecurtains.repository.BannerRepository;
import com.glydecurtains.repository.HomepageSectionRepository;
import com.glydecurtains.repository.SiteSettingsRepository;
import com.glydecurtains.repository.StaticPageRepository;
import com.glydecurtains.service.CmsService;
import com.glydecurtains.service.TranslationService;
import com.glydecurtains.util.SlugGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CmsServiceImpl implements CmsService {

    private static final String ENTITY_SECTION = "homepage_section";
    private static final String ENTITY_BANNER = "banner";
    private static final String ENTITY_PAGE = "static_page";

    private final HomepageSectionRepository sectionRepository;
    private final BannerRepository bannerRepository;
    private final SiteSettingsRepository siteSettingsRepository;
    private final StaticPageRepository staticPageRepository;
    private final TranslationService translationService;
    private final SlugGenerator slugGenerator;

    // ==================== Homepage Sections ====================

    @Override
    @Transactional(readOnly = true)
    public List<HomepageSectionResponse> getEnabledSections(String language) {
        return sectionRepository.findByIsEnabledTrueOrderBySortOrderAsc()
                .stream()
                .map(section -> mapSectionToResponse(section, language))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<HomepageSectionResponse> getAllSections(String language) {
        return sectionRepository.findAllByOrderBySortOrderAsc()
                .stream()
                .map(section -> mapSectionToResponse(section, language))
                .collect(Collectors.toList());
    }

    @Override
    public HomepageSectionResponse updateSection(Long id, SectionUpdateRequest request) {
        HomepageSection section = sectionRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Homepage section not found", "SECTION_NOT_FOUND", HttpStatus.NOT_FOUND));

        if (request.getTitle() != null) {
            section.setTitle(request.getTitle());
        }
        if (request.getIsEnabled() != null) {
            section.setIsEnabled(request.getIsEnabled());
        }
        if (request.getSortOrder() != null) {
            section.setSortOrder(request.getSortOrder());
        }
        if (request.getConfig() != null) {
            section.setConfig(request.getConfig());
        }

        HomepageSection saved = sectionRepository.save(section);

        // Save translations if provided
        if (request.getTranslations() != null) {
            for (Map.Entry<String, Map<String, String>> entry : request.getTranslations().entrySet()) {
                translationService.saveTranslations(ENTITY_SECTION, saved.getId(), entry.getKey(), entry.getValue());
            }
        }

        return mapSectionToResponse(saved, "en");
    }

    @Override
    public void reorderSections(List<SectionOrderRequest> orders) {
        for (SectionOrderRequest order : orders) {
            HomepageSection section = sectionRepository.findById(order.getId())
                    .orElseThrow(() -> new BusinessException("Homepage section not found with id: " + order.getId(), "SECTION_NOT_FOUND", HttpStatus.NOT_FOUND));
            section.setSortOrder(order.getSortOrder());
            sectionRepository.save(section);
        }
    }

    // ==================== Banners ====================

    @Override
    public BannerResponse createBanner(BannerCreateRequest request) {
        HomepageSection section = sectionRepository.findById(request.getSectionId())
                .orElseThrow(() -> new BusinessException("Homepage section not found", "SECTION_NOT_FOUND", HttpStatus.NOT_FOUND));

        Banner banner = new Banner();
        banner.setSection(section);
        banner.setTitle(request.getTitle());
        banner.setSubtitle(request.getSubtitle());
        banner.setImageBase64(request.getImageBase64());
        banner.setButtonText(request.getButtonText());
        banner.setButtonLink(request.getButtonLink());
        banner.setSortOrder(request.getSortOrder() != null ? request.getSortOrder() : 0);
        banner.setIsActive(true);

        Banner saved = bannerRepository.save(banner);

        // Save translations if provided
        if (request.getTranslations() != null) {
            for (Map.Entry<String, Map<String, String>> entry : request.getTranslations().entrySet()) {
                translationService.saveTranslations(ENTITY_BANNER, saved.getId(), entry.getKey(), entry.getValue());
            }
        }

        return mapBannerToResponse(saved, "en");
    }

    @Override
    public BannerResponse updateBanner(Long id, BannerUpdateRequest request) {
        Banner banner = bannerRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Banner not found", "BANNER_NOT_FOUND", HttpStatus.NOT_FOUND));

        if (request.getTitle() != null) {
            banner.setTitle(request.getTitle());
        }
        if (request.getSubtitle() != null) {
            banner.setSubtitle(request.getSubtitle());
        }
        if (request.getImageBase64() != null) {
            banner.setImageBase64(request.getImageBase64());
        }
        if (request.getButtonText() != null) {
            banner.setButtonText(request.getButtonText());
        }
        if (request.getButtonLink() != null) {
            banner.setButtonLink(request.getButtonLink());
        }
        if (request.getSortOrder() != null) {
            banner.setSortOrder(request.getSortOrder());
        }
        if (request.getIsActive() != null) {
            banner.setIsActive(request.getIsActive());
        }

        Banner saved = bannerRepository.save(banner);

        // Save translations if provided
        if (request.getTranslations() != null) {
            for (Map.Entry<String, Map<String, String>> entry : request.getTranslations().entrySet()) {
                translationService.saveTranslations(ENTITY_BANNER, saved.getId(), entry.getKey(), entry.getValue());
            }
        }

        return mapBannerToResponse(saved, "en");
    }

    @Override
    public void deleteBanner(Long id) {
        Banner banner = bannerRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Banner not found", "BANNER_NOT_FOUND", HttpStatus.NOT_FOUND));
        bannerRepository.delete(banner);
        translationService.deleteTranslations(ENTITY_BANNER, id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BannerResponse> getBannersBySection(Long sectionId, String language) {
        return bannerRepository.findBySectionIdOrderBySortOrderAsc(sectionId)
                .stream()
                .map(banner -> mapBannerToResponse(banner, language))
                .collect(Collectors.toList());
    }

    // ==================== Site Settings ====================

    @Override
    @Transactional(readOnly = true)
    public SiteSettingsResponse getSiteSettings() {
        SiteSettings settings = getOrCreateSiteSettings();
        return mapSiteSettingsToResponse(settings);
    }

    @Override
    public SiteSettingsResponse updateSiteSettings(SiteSettingsUpdateRequest request) {
        SiteSettings settings = getOrCreateSiteSettings();

        if (request.getLogoHeaderBase64() != null) {
            settings.setLogoHeaderBase64(request.getLogoHeaderBase64());
        }
        if (request.getLogoFooterBase64() != null) {
            settings.setLogoFooterBase64(request.getLogoFooterBase64());
        }
        if (request.getLogoMobileBase64() != null) {
            settings.setLogoMobileBase64(request.getLogoMobileBase64());
        }
        if (request.getLogoAdminBase64() != null) {
            settings.setLogoAdminBase64(request.getLogoAdminBase64());
        }
        if (request.getFaviconBase64() != null) {
            settings.setFaviconBase64(request.getFaviconBase64());
        }
        if (request.getContactEmail() != null) {
            settings.setContactEmail(request.getContactEmail());
        }
        if (request.getContactPhone() != null) {
            settings.setContactPhone(request.getContactPhone());
        }
        if (request.getAddress() != null) {
            settings.setAddress(request.getAddress());
        }
        if (request.getSocialLinks() != null) {
            settings.setSocialLinks(request.getSocialLinks());
        }
        if (request.getAnnouncementBar() != null) {
            settings.setAnnouncementBar(request.getAnnouncementBar());
        }
        if (request.getActiveThemeId() != null) {
            settings.setActiveThemeId(request.getActiveThemeId());
        }

        SiteSettings saved = siteSettingsRepository.save(settings);
        return mapSiteSettingsToResponse(saved);
    }

    // ==================== Static Pages ====================

    @Override
    public StaticPageResponse createPage(StaticPageCreateRequest request) {
        // Generate slug from title if not provided
        String slug = request.getSlug();
        if (slug == null || slug.isBlank()) {
            slug = slugGenerator.generateUnique(request.getTitle(), staticPageRepository::existsBySlug);
        } else {
            if (staticPageRepository.existsBySlug(slug)) {
                throw new BusinessException("A page with this slug already exists", "SLUG_EXISTS", HttpStatus.CONFLICT);
            }
        }

        StaticPage page = new StaticPage();
        page.setTitle(request.getTitle());
        page.setSlug(slug);
        page.setContent(request.getContent());
        page.setPageType(request.getPageType());
        page.setIsVisible(request.getIsVisible() != null ? request.getIsVisible() : true);

        StaticPage saved = staticPageRepository.save(page);

        // Save translations if provided
        if (request.getTranslations() != null) {
            for (Map.Entry<String, Map<String, String>> entry : request.getTranslations().entrySet()) {
                translationService.saveTranslations(ENTITY_PAGE, saved.getId(), entry.getKey(), entry.getValue());
            }
        }

        return mapPageToResponse(saved, "en");
    }

    @Override
    public StaticPageResponse updatePage(Long id, StaticPageUpdateRequest request) {
        StaticPage page = staticPageRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Static page not found", "PAGE_NOT_FOUND", HttpStatus.NOT_FOUND));

        if (request.getTitle() != null) {
            page.setTitle(request.getTitle());
        }
        if (request.getSlug() != null) {
            // Check if new slug conflicts with another page
            if (!request.getSlug().equals(page.getSlug()) && staticPageRepository.existsBySlug(request.getSlug())) {
                throw new BusinessException("A page with this slug already exists", "SLUG_EXISTS", HttpStatus.CONFLICT);
            }
            page.setSlug(request.getSlug());
        }
        if (request.getContent() != null) {
            page.setContent(request.getContent());
        }
        if (request.getPageType() != null) {
            page.setPageType(request.getPageType());
        }
        if (request.getIsVisible() != null) {
            page.setIsVisible(request.getIsVisible());
        }

        StaticPage saved = staticPageRepository.save(page);

        // Save translations if provided
        if (request.getTranslations() != null) {
            for (Map.Entry<String, Map<String, String>> entry : request.getTranslations().entrySet()) {
                translationService.saveTranslations(ENTITY_PAGE, saved.getId(), entry.getKey(), entry.getValue());
            }
        }

        return mapPageToResponse(saved, "en");
    }

    @Override
    @Transactional(readOnly = true)
    public StaticPageResponse getPageBySlug(String slug, String language) {
        StaticPage page = staticPageRepository.findBySlugAndIsVisibleTrue(slug)
                .orElseThrow(() -> new BusinessException("Page not found", "PAGE_NOT_FOUND", HttpStatus.NOT_FOUND));
        return mapPageToResponse(page, language);
    }

    @Override
    @Transactional(readOnly = true)
    public List<StaticPageResponse> getAllPages(String language) {
        return staticPageRepository.findAll()
                .stream()
                .map(page -> mapPageToResponse(page, language))
                .collect(Collectors.toList());
    }

    @Override
    public void deletePage(Long id) {
        StaticPage page = staticPageRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Static page not found", "PAGE_NOT_FOUND", HttpStatus.NOT_FOUND));
        staticPageRepository.delete(page);
        translationService.deleteTranslations(ENTITY_PAGE, id);
    }

    // ==================== Private Helpers ====================

    private SiteSettings getOrCreateSiteSettings() {
        return siteSettingsRepository.findById(1L)
                .orElseGet(() -> {
                    SiteSettings settings = new SiteSettings();
                    settings.setId(1L);
                    return siteSettingsRepository.save(settings);
                });
    }

    private HomepageSectionResponse mapSectionToResponse(HomepageSection section, String language) {
        List<BannerResponse> bannerResponses = null;
        if (section.getBanners() != null && !section.getBanners().isEmpty()) {
            bannerResponses = section.getBanners().stream()
                    .filter(Banner::getIsActive)
                    .map(banner -> mapBannerToResponse(banner, language))
                    .collect(Collectors.toList());
        }

        Map<String, Map<String, String>> translations = null;
        if (language != null && !"en".equals(language)) {
            Map<String, String> translated = translationService.getTranslatedFields(ENTITY_SECTION, section.getId(), language);
            if (!translated.isEmpty()) {
                translations = Map.of(language, translated);
            }
        }

        return HomepageSectionResponse.builder()
                .id(section.getId())
                .sectionType(section.getSectionType())
                .title(section.getTitle())
                .isEnabled(section.getIsEnabled())
                .sortOrder(section.getSortOrder())
                .config(section.getConfig())
                .banners(bannerResponses)
                .translations(translations)
                .createdAt(section.getCreatedAt())
                .updatedAt(section.getUpdatedAt())
                .build();
    }

    private BannerResponse mapBannerToResponse(Banner banner, String language) {
        Map<String, Map<String, String>> translations = null;
        if (language != null && !"en".equals(language)) {
            Map<String, String> translated = translationService.getTranslatedFields(ENTITY_BANNER, banner.getId(), language);
            if (!translated.isEmpty()) {
                translations = Map.of(language, translated);
            }
        }

        return BannerResponse.builder()
                .id(banner.getId())
                .sectionId(banner.getSection() != null ? banner.getSection().getId() : null)
                .title(banner.getTitle())
                .subtitle(banner.getSubtitle())
                .imageBase64(banner.getImageBase64())
                .buttonText(banner.getButtonText())
                .buttonLink(banner.getButtonLink())
                .sortOrder(banner.getSortOrder())
                .isActive(banner.getIsActive())
                .translations(translations)
                .createdAt(banner.getCreatedAt())
                .updatedAt(banner.getUpdatedAt())
                .build();
    }

    private SiteSettingsResponse mapSiteSettingsToResponse(SiteSettings settings) {
        return SiteSettingsResponse.builder()
                .id(settings.getId())
                .logoHeaderBase64(settings.getLogoHeaderBase64())
                .logoFooterBase64(settings.getLogoFooterBase64())
                .logoMobileBase64(settings.getLogoMobileBase64())
                .logoAdminBase64(settings.getLogoAdminBase64())
                .faviconBase64(settings.getFaviconBase64())
                .contactEmail(settings.getContactEmail())
                .contactPhone(settings.getContactPhone())
                .address(settings.getAddress())
                .socialLinks(settings.getSocialLinks())
                .announcementBar(settings.getAnnouncementBar())
                .activeThemeId(settings.getActiveThemeId())
                .updatedAt(settings.getUpdatedAt())
                .build();
    }

    private StaticPageResponse mapPageToResponse(StaticPage page, String language) {
        Map<String, Map<String, String>> translations = null;
        if (language != null && !"en".equals(language)) {
            Map<String, String> translated = translationService.getTranslatedFields(ENTITY_PAGE, page.getId(), language);
            if (!translated.isEmpty()) {
                translations = Map.of(language, translated);
            }
        }

        return StaticPageResponse.builder()
                .id(page.getId())
                .title(page.getTitle())
                .slug(page.getSlug())
                .content(page.getContent())
                .pageType(page.getPageType())
                .isVisible(page.getIsVisible())
                .versionTimestamp(page.getVersionTimestamp())
                .translations(translations)
                .createdAt(page.getCreatedAt())
                .updatedAt(page.getUpdatedAt())
                .build();
    }
}
