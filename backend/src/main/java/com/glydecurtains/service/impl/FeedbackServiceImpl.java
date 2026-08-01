package com.glydecurtains.service.impl;

import com.glydecurtains.dto.request.FeedbackCreateRequest;
import com.glydecurtains.dto.request.FeedbackFilterRequest;
import com.glydecurtains.dto.request.FeedbackReplyRequest;
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
import com.glydecurtains.service.FeedbackService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class FeedbackServiceImpl implements FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    @Override
    public FeedbackResponse submitFeedback(FeedbackCreateRequest request) {
        Long userId = getCurrentUserId();

        // Check one feedback per product per customer
        if (request.getProductId() != null) {
            Optional<Feedback> existing = feedbackRepository.findByUserIdAndProductId(userId, request.getProductId());
            if (existing.isPresent()) {
                throw new BusinessException("You have already submitted feedback for this product",
                        "FEEDBACK_ALREADY_EXISTS", HttpStatus.CONFLICT);
            }

            // Validate product exists
            productRepository.findById(request.getProductId())
                    .orElseThrow(() -> new BusinessException("Product not found",
                            "PRODUCT_NOT_FOUND", HttpStatus.NOT_FOUND));
        }

        Feedback feedback = new Feedback();
        feedback.setUserId(userId);
        feedback.setProductId(request.getProductId());
        feedback.setRating(request.getRating());
        feedback.setTitle(request.getTitle());
        feedback.setComment(request.getComment());
        feedback.setStatus(FeedbackStatus.PENDING_REVIEW);

        Feedback saved = feedbackRepository.save(feedback);
        return mapToResponse(saved);
    }

    @Override
    public FeedbackResponse approveFeedback(Long id) {
        Feedback feedback = feedbackRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Feedback not found",
                        "FEEDBACK_NOT_FOUND", HttpStatus.NOT_FOUND));

        feedback.setStatus(FeedbackStatus.APPROVED);
        Feedback saved = feedbackRepository.save(feedback);
        return mapToResponse(saved);
    }

    @Override
    public FeedbackResponse rejectFeedback(Long id) {
        Feedback feedback = feedbackRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Feedback not found",
                        "FEEDBACK_NOT_FOUND", HttpStatus.NOT_FOUND));

        feedback.setStatus(FeedbackStatus.REJECTED);
        Feedback saved = feedbackRepository.save(feedback);
        return mapToResponse(saved);
    }

    @Override
    public FeedbackResponse respondToFeedback(Long id, FeedbackReplyRequest request) {
        Long currentUserId = getCurrentUserId();

        Feedback feedback = feedbackRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Feedback not found",
                        "FEEDBACK_NOT_FOUND", HttpStatus.NOT_FOUND));

        feedback.setAdminReply(request.getReply());
        feedback.setRepliedById(currentUserId);

        Feedback saved = feedbackRepository.save(feedback);
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<FeedbackResponse> getFeedback(FeedbackFilterRequest filter, Pageable pageable) {
        Page<Feedback> page;

        if (filter != null && filter.getStatus() != null) {
            page = feedbackRepository.findByStatusOrderByCreatedAtDesc(filter.getStatus(), pageable);
        } else {
            page = feedbackRepository.findAllByOrderByCreatedAtDesc(pageable);
        }

        Page<FeedbackResponse> responsePage = page.map(this::mapToResponse);
        return PageResponse.from(responsePage);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<FeedbackResponse> getProductFeedback(Long productId, Pageable pageable) {
        Page<Feedback> page = feedbackRepository.findByProductIdAndStatus(
                productId, FeedbackStatus.APPROVED, pageable);
        Page<FeedbackResponse> responsePage = page.map(this::mapToResponse);
        return PageResponse.from(responsePage);
    }

    @Override
    @Transactional(readOnly = true)
    public Double getProductAverageRating(Long productId) {
        Double average = feedbackRepository.findAverageRatingByProductId(productId);
        if (average == null) {
            return 0.0;
        }
        // Round to 1 decimal place
        return BigDecimal.valueOf(average)
                .setScale(1, RoundingMode.HALF_UP)
                .doubleValue();
    }

    private FeedbackResponse mapToResponse(Feedback feedback) {
        String userName = null;
        String productName = null;
        String repliedByName = null;

        Optional<User> user = userRepository.findById(feedback.getUserId());
        if (user.isPresent()) {
            userName = user.get().getName();
        }

        if (feedback.getProductId() != null) {
            Optional<Product> product = productRepository.findById(feedback.getProductId());
            if (product.isPresent()) {
                productName = product.get().getName();
            }
        }

        if (feedback.getRepliedById() != null) {
            Optional<User> repliedBy = userRepository.findById(feedback.getRepliedById());
            if (repliedBy.isPresent()) {
                repliedByName = repliedBy.get().getName();
            }
        }

        return FeedbackResponse.builder()
                .id(feedback.getId())
                .userId(feedback.getUserId())
                .userName(userName)
                .productId(feedback.getProductId())
                .productName(productName)
                .rating(feedback.getRating())
                .title(feedback.getTitle())
                .comment(feedback.getComment())
                .status(feedback.getStatus())
                .adminReply(feedback.getAdminReply())
                .repliedById(feedback.getRepliedById())
                .repliedByName(repliedByName)
                .createdAt(feedback.getCreatedAt())
                .updatedAt(feedback.getUpdatedAt())
                .build();
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Long) {
            return (Long) authentication.getPrincipal();
        }
        throw new BusinessException("User not authenticated", "UNAUTHORIZED", HttpStatus.UNAUTHORIZED);
    }
}
