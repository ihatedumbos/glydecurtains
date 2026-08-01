package com.glydecurtains.controller;

import com.glydecurtains.dto.request.FeedbackCreateRequest;
import com.glydecurtains.dto.request.FeedbackFilterRequest;
import com.glydecurtains.dto.request.FeedbackReplyRequest;
import com.glydecurtains.dto.response.ApiResponse;
import com.glydecurtains.dto.response.FeedbackResponse;
import com.glydecurtains.dto.response.PageResponse;
import com.glydecurtains.entity.enums.FeedbackStatus;
import com.glydecurtains.security.RequiresPermission;
import com.glydecurtains.service.FeedbackService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/feedback")
@RequiredArgsConstructor
public class FeedbackController {

    private final FeedbackService feedbackService;

    @PostMapping
    @RequiresPermission(entity = "feedback", operation = "CREATE")
    public ResponseEntity<ApiResponse<FeedbackResponse>> submitFeedback(
            @Valid @RequestBody FeedbackCreateRequest request) {
        FeedbackResponse response = feedbackService.submitFeedback(request);
        return ResponseEntity.status(201).body(ApiResponse.created("Feedback submitted successfully", response));
    }

    @GetMapping("/public")
    public ResponseEntity<ApiResponse<PageResponse<FeedbackResponse>>> getPublicFeedback(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "6") int size) {
        FeedbackFilterRequest filter = new FeedbackFilterRequest();
        filter.setStatus(FeedbackStatus.APPROVED);

        PageResponse<FeedbackResponse> response =
                feedbackService.getFeedback(filter, PageRequest.of(page, size));

        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/products/{productId}")
    public ResponseEntity<ApiResponse<PageResponse<FeedbackResponse>>> getProductFeedback(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        PageResponse<FeedbackResponse> response = feedbackService.getProductFeedback(productId, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/products/{productId}/rating")
    public ResponseEntity<ApiResponse<Double>> getProductAverageRating(
            @PathVariable Long productId) {
        Double rating = feedbackService.getProductAverageRating(productId);
        return ResponseEntity.ok(ApiResponse.success(rating));
    }

    @GetMapping
    @RequiresPermission(entity = "feedback", operation = "READ")
    public ResponseEntity<ApiResponse<PageResponse<FeedbackResponse>>> getAllFeedback(
            @RequestParam(required = false) FeedbackStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        FeedbackFilterRequest filter = new FeedbackFilterRequest();
        filter.setStatus(status);
        Pageable pageable = PageRequest.of(page, size);
        PageResponse<FeedbackResponse> response = feedbackService.getFeedback(filter, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}/approve")
    @RequiresPermission(entity = "feedback", operation = "UPDATE")
    public ResponseEntity<ApiResponse<FeedbackResponse>> approveFeedback(@PathVariable Long id) {
        FeedbackResponse response = feedbackService.approveFeedback(id);
        return ResponseEntity.ok(ApiResponse.success("Feedback approved successfully", response));
    }

    @PutMapping("/{id}/reject")
    @RequiresPermission(entity = "feedback", operation = "UPDATE")
    public ResponseEntity<ApiResponse<FeedbackResponse>> rejectFeedback(@PathVariable Long id) {
        FeedbackResponse response = feedbackService.rejectFeedback(id);
        return ResponseEntity.ok(ApiResponse.success("Feedback rejected successfully", response));
    }

    @PostMapping("/{id}/reply")
    @RequiresPermission(entity = "feedback", operation = "UPDATE")
    public ResponseEntity<ApiResponse<FeedbackResponse>> replyToFeedback(
            @PathVariable Long id,
            @Valid @RequestBody FeedbackReplyRequest request) {
        FeedbackResponse response = feedbackService.respondToFeedback(id, request);
        return ResponseEntity.ok(ApiResponse.success("Reply added successfully", response));
    }
}
