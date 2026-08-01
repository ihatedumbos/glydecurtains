package com.glydecurtains.service;

import com.glydecurtains.dto.request.FeedbackCreateRequest;
import com.glydecurtains.dto.request.FeedbackFilterRequest;
import com.glydecurtains.dto.response.FeedbackResponse;
import com.glydecurtains.dto.response.PageResponse;
import com.glydecurtains.entity.Feedback;
import com.glydecurtains.entity.Product;
import com.glydecurtains.entity.User;
import com.glydecurtains.entity.enums.FeedbackStatus;
import com.glydecurtains.exception.BusinessException;
import com.glydecurtains.repository.FeedbackRepository;
import com.glydecurtains.repository.ProductRepository;
import com.glydecurtains.repository.UserRepository;
import com.glydecurtains.service.impl.FeedbackServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FeedbackServiceTest {

    @Mock
    private FeedbackRepository feedbackRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private FeedbackServiceImpl feedbackService;

    private static final Long USER_ID = 1L;
    private static final Long PRODUCT_ID = 10L;
    private static final Long FEEDBACK_ID = 100L;

    private User user;
    private Product product;
    private Feedback feedback;

    @BeforeEach
    void setUp() {
        setupSecurityContext();

        user = new User();
        user.setId(USER_ID);
        user.setName("John Doe");

        product = new Product();
        product.setId(PRODUCT_ID);
        product.setName("Premium Curtain");

        feedback = new Feedback();
        feedback.setId(FEEDBACK_ID);
        feedback.setUserId(USER_ID);
        feedback.setProductId(PRODUCT_ID);
        feedback.setRating(4);
        feedback.setTitle("Great product");
        feedback.setComment("Really enjoyed this curtain");
        feedback.setStatus(FeedbackStatus.PENDING_REVIEW);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Nested
    @DisplayName("submitFeedback")
    class SubmitFeedback {

        @Test
        @DisplayName("should submit feedback successfully for a product")
        void shouldSubmitFeedbackSuccessfully() {
            FeedbackCreateRequest request = new FeedbackCreateRequest(PRODUCT_ID, 4, "Great product", "Really enjoyed this curtain");

            when(feedbackRepository.findByUserIdAndProductId(USER_ID, PRODUCT_ID)).thenReturn(Optional.empty());
            when(productRepository.findById(PRODUCT_ID)).thenReturn(Optional.of(product));
            when(feedbackRepository.save(any(Feedback.class))).thenReturn(feedback);
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));

            FeedbackResponse response = feedbackService.submitFeedback(request);

            assertThat(response).isNotNull();
            assertThat(response.getRating()).isEqualTo(4);
            assertThat(response.getTitle()).isEqualTo("Great product");
            assertThat(response.getStatus()).isEqualTo(FeedbackStatus.PENDING_REVIEW);
            verify(feedbackRepository).save(any(Feedback.class));
        }

        @Test
        @DisplayName("should submit feedback without product id (general feedback)")
        void shouldSubmitGeneralFeedback() {
            FeedbackCreateRequest request = new FeedbackCreateRequest(null, 5, "Great service", "Amazing customer service");

            Feedback generalFeedback = new Feedback();
            generalFeedback.setId(101L);
            generalFeedback.setUserId(USER_ID);
            generalFeedback.setProductId(null);
            generalFeedback.setRating(5);
            generalFeedback.setTitle("Great service");
            generalFeedback.setComment("Amazing customer service");
            generalFeedback.setStatus(FeedbackStatus.PENDING_REVIEW);

            when(feedbackRepository.save(any(Feedback.class))).thenReturn(generalFeedback);
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));

            FeedbackResponse response = feedbackService.submitFeedback(request);

            assertThat(response).isNotNull();
            assertThat(response.getProductId()).isNull();
            assertThat(response.getRating()).isEqualTo(5);
            assertThat(response.getStatus()).isEqualTo(FeedbackStatus.PENDING_REVIEW);
            verify(feedbackRepository).save(any(Feedback.class));
        }

        @Test
        @DisplayName("should throw exception when duplicate feedback for same product")
        void shouldThrowWhenDuplicateFeedback() {
            FeedbackCreateRequest request = new FeedbackCreateRequest(PRODUCT_ID, 3, "Another review", "Duplicate review");

            when(feedbackRepository.findByUserIdAndProductId(USER_ID, PRODUCT_ID)).thenReturn(Optional.of(feedback));

            assertThatThrownBy(() -> feedbackService.submitFeedback(request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("already submitted feedback");
        }

        @Test
        @DisplayName("should throw exception when product not found")
        void shouldThrowWhenProductNotFound() {
            FeedbackCreateRequest request = new FeedbackCreateRequest(999L, 4, "Review", "Product does not exist");

            when(feedbackRepository.findByUserIdAndProductId(USER_ID, 999L)).thenReturn(Optional.empty());
            when(productRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> feedbackService.submitFeedback(request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Product not found");
        }
    }

    @Nested
    @DisplayName("approveFeedback")
    class ApproveFeedback {

        @Test
        @DisplayName("should approve feedback successfully")
        void shouldApproveFeedbackSuccessfully() {
            Feedback approvedFeedback = new Feedback();
            approvedFeedback.setId(FEEDBACK_ID);
            approvedFeedback.setUserId(USER_ID);
            approvedFeedback.setProductId(PRODUCT_ID);
            approvedFeedback.setRating(4);
            approvedFeedback.setTitle("Great product");
            approvedFeedback.setComment("Really enjoyed this curtain");
            approvedFeedback.setStatus(FeedbackStatus.APPROVED);

            when(feedbackRepository.findById(FEEDBACK_ID)).thenReturn(Optional.of(feedback));
            when(feedbackRepository.save(any(Feedback.class))).thenReturn(approvedFeedback);
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
            when(productRepository.findById(PRODUCT_ID)).thenReturn(Optional.of(product));

            FeedbackResponse response = feedbackService.approveFeedback(FEEDBACK_ID);

            assertThat(response).isNotNull();
            assertThat(response.getStatus()).isEqualTo(FeedbackStatus.APPROVED);
            verify(feedbackRepository).save(any(Feedback.class));
        }

        @Test
        @DisplayName("should throw exception when feedback not found")
        void shouldThrowWhenFeedbackNotFound() {
            when(feedbackRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> feedbackService.approveFeedback(999L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Feedback not found");
        }
    }

    @Nested
    @DisplayName("rejectFeedback")
    class RejectFeedback {

        @Test
        @DisplayName("should reject feedback successfully")
        void shouldRejectFeedbackSuccessfully() {
            Feedback rejectedFeedback = new Feedback();
            rejectedFeedback.setId(FEEDBACK_ID);
            rejectedFeedback.setUserId(USER_ID);
            rejectedFeedback.setProductId(PRODUCT_ID);
            rejectedFeedback.setRating(4);
            rejectedFeedback.setTitle("Great product");
            rejectedFeedback.setComment("Really enjoyed this curtain");
            rejectedFeedback.setStatus(FeedbackStatus.REJECTED);

            when(feedbackRepository.findById(FEEDBACK_ID)).thenReturn(Optional.of(feedback));
            when(feedbackRepository.save(any(Feedback.class))).thenReturn(rejectedFeedback);
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
            when(productRepository.findById(PRODUCT_ID)).thenReturn(Optional.of(product));

            FeedbackResponse response = feedbackService.rejectFeedback(FEEDBACK_ID);

            assertThat(response).isNotNull();
            assertThat(response.getStatus()).isEqualTo(FeedbackStatus.REJECTED);
            verify(feedbackRepository).save(any(Feedback.class));
        }

        @Test
        @DisplayName("should throw exception when feedback not found")
        void shouldThrowWhenFeedbackNotFound() {
            when(feedbackRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> feedbackService.rejectFeedback(999L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Feedback not found");
        }
    }

    @Nested
    @DisplayName("getProductAverageRating")
    class GetProductAverageRating {

        @Test
        @DisplayName("should return average rating rounded to 1 decimal place")
        void shouldReturnAverageRatingRounded() {
            when(feedbackRepository.findAverageRatingByProductId(PRODUCT_ID)).thenReturn(4.333);

            Double average = feedbackService.getProductAverageRating(PRODUCT_ID);

            assertThat(average).isEqualTo(4.3);
        }

        @Test
        @DisplayName("should return 0.0 when no approved feedback exists")
        void shouldReturnZeroWhenNoFeedback() {
            when(feedbackRepository.findAverageRatingByProductId(PRODUCT_ID)).thenReturn(null);

            Double average = feedbackService.getProductAverageRating(PRODUCT_ID);

            assertThat(average).isEqualTo(0.0);
        }

        @Test
        @DisplayName("should round up when second decimal is 5 or more")
        void shouldRoundUpCorrectly() {
            when(feedbackRepository.findAverageRatingByProductId(PRODUCT_ID)).thenReturn(3.75);

            Double average = feedbackService.getProductAverageRating(PRODUCT_ID);

            assertThat(average).isEqualTo(3.8);
        }

        @Test
        @DisplayName("should handle exact integer averages")
        void shouldHandleExactIntegerAverages() {
            when(feedbackRepository.findAverageRatingByProductId(PRODUCT_ID)).thenReturn(5.0);

            Double average = feedbackService.getProductAverageRating(PRODUCT_ID);

            assertThat(average).isEqualTo(5.0);
        }
    }

    @Nested
    @DisplayName("getFeedback (pending feedback)")
    class GetPendingFeedback {

        @Test
        @DisplayName("should return pending feedback with pagination")
        void shouldReturnPendingFeedback() {
            FeedbackFilterRequest filter = new FeedbackFilterRequest(FeedbackStatus.PENDING_REVIEW, null);
            Pageable pageable = PageRequest.of(0, 10);

            Page<Feedback> page = new PageImpl<>(List.of(feedback), pageable, 1);
            when(feedbackRepository.findByStatusOrderByCreatedAtDesc(FeedbackStatus.PENDING_REVIEW, pageable))
                    .thenReturn(page);
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
            when(productRepository.findById(PRODUCT_ID)).thenReturn(Optional.of(product));

            PageResponse<FeedbackResponse> response = feedbackService.getFeedback(filter, pageable);

            assertThat(response).isNotNull();
            assertThat(response.getContent()).hasSize(1);
            assertThat(response.getContent().get(0).getStatus()).isEqualTo(FeedbackStatus.PENDING_REVIEW);
            assertThat(response.getTotalElements()).isEqualTo(1);
        }

        @Test
        @DisplayName("should return all feedback when no filter status provided")
        void shouldReturnAllFeedbackWhenNoFilter() {
            FeedbackFilterRequest filter = new FeedbackFilterRequest(null, null);
            Pageable pageable = PageRequest.of(0, 10);

            Feedback approvedFeedback = new Feedback();
            approvedFeedback.setId(101L);
            approvedFeedback.setUserId(USER_ID);
            approvedFeedback.setProductId(PRODUCT_ID);
            approvedFeedback.setRating(5);
            approvedFeedback.setTitle("Excellent");
            approvedFeedback.setComment("Loved it");
            approvedFeedback.setStatus(FeedbackStatus.APPROVED);

            Page<Feedback> page = new PageImpl<>(List.of(feedback, approvedFeedback), pageable, 2);
            when(feedbackRepository.findAllByOrderByCreatedAtDesc(pageable)).thenReturn(page);
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
            when(productRepository.findById(PRODUCT_ID)).thenReturn(Optional.of(product));

            PageResponse<FeedbackResponse> response = feedbackService.getFeedback(filter, pageable);

            assertThat(response).isNotNull();
            assertThat(response.getContent()).hasSize(2);
            assertThat(response.getTotalElements()).isEqualTo(2);
        }

        @Test
        @DisplayName("should return all feedback when filter is null")
        void shouldReturnAllFeedbackWhenFilterIsNull() {
            Pageable pageable = PageRequest.of(0, 10);

            Page<Feedback> page = new PageImpl<>(List.of(feedback), pageable, 1);
            when(feedbackRepository.findAllByOrderByCreatedAtDesc(pageable)).thenReturn(page);
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
            when(productRepository.findById(PRODUCT_ID)).thenReturn(Optional.of(product));

            PageResponse<FeedbackResponse> response = feedbackService.getFeedback(null, pageable);

            assertThat(response).isNotNull();
            assertThat(response.getContent()).hasSize(1);
        }
    }

    private void setupSecurityContext() {
        Authentication authentication = mock(Authentication.class);
        lenient().when(authentication.getPrincipal()).thenReturn(USER_ID);
        SecurityContext securityContext = mock(SecurityContext.class);
        lenient().when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
    }
}
