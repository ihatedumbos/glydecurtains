package com.glydecurtains.service;

import com.glydecurtains.dto.request.EnquiryCreateRequest;
import com.glydecurtains.dto.request.EnquiryFilterRequest;
import com.glydecurtains.dto.request.EnquiryReplyRequest;
import com.glydecurtains.dto.request.EnquiryStatusUpdateRequest;
import com.glydecurtains.dto.response.EnquiryDetailResponse;
import com.glydecurtains.dto.response.EnquiryResponseDto;
import com.glydecurtains.dto.response.PageResponse;
import org.springframework.data.domain.Pageable;

public interface EnquiryService {

    EnquiryResponseDto submitEnquiry(EnquiryCreateRequest request);

    EnquiryResponseDto updateStatus(Long id, EnquiryStatusUpdateRequest request);

    EnquiryResponseDto respondToEnquiry(Long id, EnquiryReplyRequest request, Long responderId);

    PageResponse<EnquiryResponseDto> getEnquiries(EnquiryFilterRequest filter, Pageable pageable);

    EnquiryDetailResponse getEnquiry(Long id);
}
