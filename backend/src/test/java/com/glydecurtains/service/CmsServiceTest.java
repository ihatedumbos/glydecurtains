package com.glydecurtains.service;

import com.glydecurtains.dto.request.StaticPageCreateRequest;
import com.glydecurtains.dto.request.StaticPageUpdateRequest;
import com.glydecurtains.dto.response.StaticPageResponse;
import com.glydecurtains.entity.StaticPage;
import com.glydecurtains.entity.enums.PageType;
import com.glydecurtains.exception.BusinessException;
import com.glydecurtains.repository.BannerRepository;
import com.glydecurtains.repository.HomepageSectionRepository;
import com.glydecurtains.repository.SiteSettingsRepository;
import com.glydecurtains.repository.StaticPageRepository;
import com.glydecurtains.service.impl.CmsServiceImpl;
import com.glydecurtains.util.SlugGenerator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CmsServiceTest {

    @Mock
    private HomepageSectionRepository sectionRepository;

    @Mock
    private BannerRepository bannerRepository;

    @Mock
    private SiteSettingsRepository siteSettingsRepository;

    @Mock
    private StaticPageRepository staticPageRepository;

    @Mock
    private TranslationService translationService;

    @Mock
    private SlugGenerator slugGenerator;

    @InjectMocks
    private CmsServiceImpl cmsService;

    private StaticPage samplePage;

    @BeforeEach
    void setUp() {
        samplePage = new StaticPage();
        samplePage.setId(1L);
        samplePage.setTitle("About Us");
        samplePage.setSlug("about-us");
        samplePage.setContent("<p>Welcome to Glyde Curtains</p>");
        samplePage.setPageType(PageType.ABOUT_US);
        samplePage.setIsVisible(true);
        samplePage.setVersionTimestamp(LocalDateTime.now());
    }

    @Nested
    @DisplayName("Create Page")
    class CreatePageTests {

        @Test
        @DisplayName("should create page successfully with provided slug")
        void createPage_withProvidedSlug_shouldReturnPageResponse() {
            StaticPageCreateRequest request = new StaticPageCreateRequest();
            request.setTitle("Terms & Conditions");
            request.setSlug("terms-and-conditions");
            request.setContent("<p>Terms content</p>");
            request.setPageType(PageType.TERMS);
            request.setIsVisible(true);

            when(staticPageRepository.existsBySlug("terms-and-conditions")).thenReturn(false);
            when(staticPageRepository.save(any(StaticPage.class))).thenAnswer(invocation -> {
                StaticPage saved = invocation.getArgument(0);
                saved.setId(2L);
                saved.setVersionTimestamp(LocalDateTime.now());
                return saved;
            });

            StaticPageResponse response = cmsService.createPage(request);

            assertThat(response).isNotNull();
            assertThat(response.getTitle()).isEqualTo("Terms & Conditions");
            assertThat(response.getSlug()).isEqualTo("terms-and-conditions");
            assertThat(response.getPageType()).isEqualTo(PageType.TERMS);
            assertThat(response.getIsVisible()).isTrue();
            verify(staticPageRepository).existsBySlug("terms-and-conditions");
            verify(staticPageRepository).save(any(StaticPage.class));
        }

        @Test
        @DisplayName("should generate slug from title when slug is not provided")
        void createPage_withoutSlug_shouldGenerateSlugFromTitle() {
            StaticPageCreateRequest request = new StaticPageCreateRequest();
            request.setTitle("Privacy Policy");
            request.setSlug(null);
            request.setContent("<p>Privacy content</p>");
            request.setPageType(PageType.PRIVACY_POLICY);

            when(slugGenerator.generateUnique(eq("Privacy Policy"), any())).thenReturn("privacy-policy");
            when(staticPageRepository.save(any(StaticPage.class))).thenAnswer(invocation -> {
                StaticPage saved = invocation.getArgument(0);
                saved.setId(3L);
                saved.setVersionTimestamp(LocalDateTime.now());
                return saved;
            });

            StaticPageResponse response = cmsService.createPage(request);

            assertThat(response).isNotNull();
            assertThat(response.getSlug()).isEqualTo("privacy-policy");
            verify(slugGenerator).generateUnique(eq("Privacy Policy"), any());
            verify(staticPageRepository, never()).existsBySlug(anyString());
        }

        @Test
        @DisplayName("should throw BusinessException when duplicate slug is provided")
        void createPage_withDuplicateSlug_shouldThrowBusinessException() {
            StaticPageCreateRequest request = new StaticPageCreateRequest();
            request.setTitle("About Us");
            request.setSlug("about-us");
            request.setContent("<p>About content</p>");
            request.setPageType(PageType.ABOUT_US);

            when(staticPageRepository.existsBySlug("about-us")).thenReturn(true);

            assertThatThrownBy(() -> cmsService.createPage(request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("slug already exists")
                    .extracting("errorCode")
                    .isEqualTo("SLUG_EXISTS");

            verify(staticPageRepository, never()).save(any(StaticPage.class));
        }

        @Test
        @DisplayName("should default isVisible to true when not provided")
        void createPage_withNullIsVisible_shouldDefaultToTrue() {
            StaticPageCreateRequest request = new StaticPageCreateRequest();
            request.setTitle("Custom Page");
            request.setSlug("custom-page");
            request.setContent("<p>Custom</p>");
            request.setPageType(PageType.CUSTOM);
            request.setIsVisible(null);

            when(staticPageRepository.existsBySlug("custom-page")).thenReturn(false);
            when(staticPageRepository.save(any(StaticPage.class))).thenAnswer(invocation -> {
                StaticPage saved = invocation.getArgument(0);
                saved.setId(4L);
                saved.setVersionTimestamp(LocalDateTime.now());
                return saved;
            });

            StaticPageResponse response = cmsService.createPage(request);

            assertThat(response.getIsVisible()).isTrue();
        }
    }

    @Nested
    @DisplayName("Update Page")
    class UpdatePageTests {

        @Test
        @DisplayName("should update page title and content successfully")
        void updatePage_withValidFields_shouldReturnUpdatedResponse() {
            StaticPageUpdateRequest request = new StaticPageUpdateRequest();
            request.setTitle("Updated Title");
            request.setContent("<p>Updated content</p>");

            when(staticPageRepository.findById(1L)).thenReturn(Optional.of(samplePage));
            when(staticPageRepository.save(any(StaticPage.class))).thenAnswer(invocation -> invocation.getArgument(0));

            StaticPageResponse response = cmsService.updatePage(1L, request);

            assertThat(response).isNotNull();
            assertThat(response.getTitle()).isEqualTo("Updated Title");
            assertThat(response.getContent()).isEqualTo("<p>Updated content</p>");
            verify(staticPageRepository).findById(1L);
            verify(staticPageRepository).save(any(StaticPage.class));
        }

        @Test
        @DisplayName("should update page slug when new slug does not conflict")
        void updatePage_withNewSlug_shouldUpdateSlug() {
            StaticPageUpdateRequest request = new StaticPageUpdateRequest();
            request.setSlug("new-about-us");

            when(staticPageRepository.findById(1L)).thenReturn(Optional.of(samplePage));
            when(staticPageRepository.existsBySlug("new-about-us")).thenReturn(false);
            when(staticPageRepository.save(any(StaticPage.class))).thenAnswer(invocation -> invocation.getArgument(0));

            StaticPageResponse response = cmsService.updatePage(1L, request);

            assertThat(response.getSlug()).isEqualTo("new-about-us");
        }

        @Test
        @DisplayName("should throw BusinessException when updating slug to a duplicate")
        void updatePage_withDuplicateSlug_shouldThrowBusinessException() {
            StaticPageUpdateRequest request = new StaticPageUpdateRequest();
            request.setSlug("existing-slug");

            when(staticPageRepository.findById(1L)).thenReturn(Optional.of(samplePage));
            when(staticPageRepository.existsBySlug("existing-slug")).thenReturn(true);

            assertThatThrownBy(() -> cmsService.updatePage(1L, request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("slug already exists")
                    .extracting("errorCode")
                    .isEqualTo("SLUG_EXISTS");

            verify(staticPageRepository, never()).save(any(StaticPage.class));
        }

        @Test
        @DisplayName("should throw BusinessException when page not found")
        void updatePage_withNonExistentId_shouldThrowBusinessException() {
            StaticPageUpdateRequest request = new StaticPageUpdateRequest();
            request.setTitle("Title");

            when(staticPageRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> cmsService.updatePage(99L, request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("page not found")
                    .extracting("httpStatus")
                    .isEqualTo(HttpStatus.NOT_FOUND);
        }

        @Test
        @DisplayName("should allow same slug when it hasn't changed")
        void updatePage_withSameSlug_shouldNotThrow() {
            StaticPageUpdateRequest request = new StaticPageUpdateRequest();
            request.setSlug("about-us"); // Same as existing

            when(staticPageRepository.findById(1L)).thenReturn(Optional.of(samplePage));
            when(staticPageRepository.save(any(StaticPage.class))).thenAnswer(invocation -> invocation.getArgument(0));

            StaticPageResponse response = cmsService.updatePage(1L, request);

            assertThat(response.getSlug()).isEqualTo("about-us");
            verify(staticPageRepository, never()).existsBySlug(anyString());
        }
    }

    @Nested
    @DisplayName("Publish/Unpublish Page")
    class PublishUnpublishTests {

        @Test
        @DisplayName("should publish page by setting isVisible to true")
        void publishPage_shouldSetIsVisibleToTrue() {
            samplePage.setIsVisible(false);

            StaticPageUpdateRequest request = new StaticPageUpdateRequest();
            request.setIsVisible(true);

            when(staticPageRepository.findById(1L)).thenReturn(Optional.of(samplePage));
            when(staticPageRepository.save(any(StaticPage.class))).thenAnswer(invocation -> invocation.getArgument(0));

            StaticPageResponse response = cmsService.updatePage(1L, request);

            assertThat(response.getIsVisible()).isTrue();
            verify(staticPageRepository).save(any(StaticPage.class));
        }

        @Test
        @DisplayName("should unpublish page by setting isVisible to false")
        void unpublishPage_shouldSetIsVisibleToFalse() {
            samplePage.setIsVisible(true);

            StaticPageUpdateRequest request = new StaticPageUpdateRequest();
            request.setIsVisible(false);

            when(staticPageRepository.findById(1L)).thenReturn(Optional.of(samplePage));
            when(staticPageRepository.save(any(StaticPage.class))).thenAnswer(invocation -> invocation.getArgument(0));

            StaticPageResponse response = cmsService.updatePage(1L, request);

            assertThat(response.getIsVisible()).isFalse();
            verify(staticPageRepository).save(any(StaticPage.class));
        }
    }

    @Nested
    @DisplayName("Get Page By Slug")
    class GetPageBySlugTests {

        @Test
        @DisplayName("should return page when visible page found by slug")
        void getPageBySlug_withVisiblePage_shouldReturnResponse() {
            when(staticPageRepository.findBySlugAndIsVisibleTrue("about-us"))
                    .thenReturn(Optional.of(samplePage));

            StaticPageResponse response = cmsService.getPageBySlug("about-us", "en");

            assertThat(response).isNotNull();
            assertThat(response.getTitle()).isEqualTo("About Us");
            assertThat(response.getSlug()).isEqualTo("about-us");
            verify(staticPageRepository).findBySlugAndIsVisibleTrue("about-us");
        }

        @Test
        @DisplayName("should throw BusinessException when page not found or not visible")
        void getPageBySlug_withNonVisiblePage_shouldThrowBusinessException() {
            when(staticPageRepository.findBySlugAndIsVisibleTrue("hidden-page"))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> cmsService.getPageBySlug("hidden-page", "en"))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Page not found")
                    .extracting("httpStatus")
                    .isEqualTo(HttpStatus.NOT_FOUND);
        }
    }

    @Nested
    @DisplayName("Duplicate Slug Rejection")
    class DuplicateSlugRejectionTests {

        @Test
        @DisplayName("should reject create with duplicate slug and return CONFLICT status")
        void createPage_duplicateSlug_shouldReturnConflictStatus() {
            StaticPageCreateRequest request = new StaticPageCreateRequest();
            request.setTitle("Duplicate");
            request.setSlug("about-us");
            request.setContent("<p>Content</p>");
            request.setPageType(PageType.CUSTOM);

            when(staticPageRepository.existsBySlug("about-us")).thenReturn(true);

            assertThatThrownBy(() -> cmsService.createPage(request))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> {
                        BusinessException bex = (BusinessException) ex;
                        assertThat(bex.getErrorCode()).isEqualTo("SLUG_EXISTS");
                        assertThat(bex.getHttpStatus()).isEqualTo(HttpStatus.CONFLICT);
                    });
        }

        @Test
        @DisplayName("should reject update with slug that belongs to another page")
        void updatePage_slugBelongsToAnotherPage_shouldThrowConflict() {
            StaticPageUpdateRequest request = new StaticPageUpdateRequest();
            request.setSlug("terms");

            when(staticPageRepository.findById(1L)).thenReturn(Optional.of(samplePage));
            when(staticPageRepository.existsBySlug("terms")).thenReturn(true);

            assertThatThrownBy(() -> cmsService.updatePage(1L, request))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> {
                        BusinessException bex = (BusinessException) ex;
                        assertThat(bex.getErrorCode()).isEqualTo("SLUG_EXISTS");
                        assertThat(bex.getHttpStatus()).isEqualTo(HttpStatus.CONFLICT);
                    });
        }
    }
}
