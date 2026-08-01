package com.glydecurtains.service;

import com.glydecurtains.dto.request.*;
import com.glydecurtains.dto.response.*;

import java.util.List;

public interface CmsService {

    // Homepage sections
    List<HomepageSectionResponse> getEnabledSections(String language);

    List<HomepageSectionResponse> getAllSections(String language);

    HomepageSectionResponse updateSection(Long id, SectionUpdateRequest request);

    void reorderSections(List<SectionOrderRequest> orders);

    // Banners
    BannerResponse createBanner(BannerCreateRequest request);

    BannerResponse updateBanner(Long id, BannerUpdateRequest request);

    void deleteBanner(Long id);

    List<BannerResponse> getBannersBySection(Long sectionId, String language);

    // Site settings
    SiteSettingsResponse getSiteSettings();

    SiteSettingsResponse updateSiteSettings(SiteSettingsUpdateRequest request);

    // Static pages
    StaticPageResponse createPage(StaticPageCreateRequest request);

    StaticPageResponse updatePage(Long id, StaticPageUpdateRequest request);

    StaticPageResponse getPageBySlug(String slug, String language);

    List<StaticPageResponse> getAllPages(String language);

    void deletePage(Long id);
}
