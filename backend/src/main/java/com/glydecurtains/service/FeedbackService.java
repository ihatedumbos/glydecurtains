package com.glydecurtains.service;

import com.glydecurtains.dto.request.FeedbackCreateRequest;
import com.glydecurtains.dto.request.FeedbackFilterRequest;
import com.glydecurtains.dto.request.FeedbackReplyRequest;
import com.glydecurtains.dto.response.FeedbackResponse;
import com.glydecurtains.dto.response.PageResponse;
import org.springframework.data.domain.Pageable;

public interface FeedbackService {

    FeedbackResponse submitFeedback(FeedbackCreateRequest request);

    FeedbackResponse approveFeedback(Long id);

    FeedbackResponse rejectFeedback(Long id);

    FeedbackResponse respondToFeedback(Long id, FeedbackReplyRequest request);

    PageResponse<FeedbackResponse> getFeedback(FeedbackFilterRequest filter, Pageable pageable);

    PageResponse<FeedbackResponse> getProductFeedback(Long productId, Pageable pageable);

    Double getProductAverageRating(Long productId);
}
