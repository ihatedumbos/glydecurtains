package com.glydecurtains.controller;

import com.glydecurtains.dto.request.EnquiryCreateRequest;
import com.glydecurtains.dto.request.EnquiryFilterRequest;
import com.glydecurtains.dto.request.EnquiryReplyRequest;
import com.glydecurtains.dto.request.EnquiryStatusUpdateRequest;
import com.glydecurtains.dto.response.ApiResponse;
import com.glydecurtains.dto.response.EnquiryDetailResponse;
import com.glydecurtains.dto.response.EnquiryResponseDto;
import com.glydecurtains.dto.response.PageResponse;
import com.glydecurtains.entity.enums.EnquiryStatus;
import com.glydecurtains.security.RequiresPermission;
import com.glydecurtains.service.EnquiryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/enquiries")
@RequiredArgsConstructor
public class EnquiryController {

    private final EnquiryService enquiryService;

    @PostMapping("/public/submit")
    public ResponseEntity<ApiResponse<EnquiryResponseDto>> submitEnquiry(
            @Valid @RequestBody EnquiryCreateRequest request) {
        EnquiryResponseDto response = enquiryService.submitEnquiry(request);
        return ResponseEntity.status(201).body(ApiResponse.created("Enquiry submitted successfully", response));
    }

    @GetMapping
    @RequiresPermission(entity = "enquiries", operation = "READ")
    public ResponseEntity<ApiResponse<PageResponse<EnquiryResponseDto>>> getEnquiries(
            @RequestParam(required = false) EnquiryStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        EnquiryFilterRequest filter = new EnquiryFilterRequest(status, search);
        Pageable pageable = PageRequest.of(page, size);
        PageResponse<EnquiryResponseDto> response = enquiryService.getEnquiries(filter, pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @RequiresPermission(entity = "enquiries", operation = "READ")
    public ResponseEntity<ApiResponse<EnquiryDetailResponse>> getEnquiry(@PathVariable Long id) {
        EnquiryDetailResponse response = enquiryService.getEnquiry(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}/status")
    @RequiresPermission(entity = "enquiries", operation = "UPDATE")
    public ResponseEntity<ApiResponse<EnquiryResponseDto>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody EnquiryStatusUpdateRequest request) {
        EnquiryResponseDto response = enquiryService.updateStatus(id, request);
        return ResponseEntity.ok(ApiResponse.success("Enquiry status updated successfully", response));
    }

    @PostMapping("/{id}/reply")
    @RequiresPermission(entity = "enquiries", operation = "UPDATE")
    public ResponseEntity<ApiResponse<EnquiryResponseDto>> replyToEnquiry(
            @PathVariable Long id,
            @Valid @RequestBody EnquiryReplyRequest request) {
        Long responderId = getCurrentUserId();
        EnquiryResponseDto response = enquiryService.respondToEnquiry(id, request, responderId);
        return ResponseEntity.ok(ApiResponse.success("Reply sent successfully", response));
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Long) {
            return (Long) authentication.getPrincipal();
        }
        return null;
    }
}
