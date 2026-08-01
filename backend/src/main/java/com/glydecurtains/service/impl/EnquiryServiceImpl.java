package com.glydecurtains.service.impl;

import com.glydecurtains.dto.request.EnquiryCreateRequest;
import com.glydecurtains.dto.request.EnquiryFilterRequest;
import com.glydecurtains.dto.request.EnquiryReplyRequest;
import com.glydecurtains.dto.request.EnquiryStatusUpdateRequest;
import com.glydecurtains.dto.response.EnquiryDetailResponse;
import com.glydecurtains.dto.response.EnquiryReplyResponse;
import com.glydecurtains.dto.response.EnquiryResponseDto;
import com.glydecurtains.dto.response.PageResponse;
import com.glydecurtains.entity.Enquiry;
import com.glydecurtains.entity.EnquiryResponse;
import com.glydecurtains.entity.enums.EnquiryStatus;
import com.glydecurtains.exception.BusinessException;
import com.glydecurtains.repository.EnquiryRepository;
import com.glydecurtains.repository.EnquiryResponseRepository;
import com.glydecurtains.service.EnquiryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class EnquiryServiceImpl implements EnquiryService {

    private final EnquiryRepository enquiryRepository;
    private final EnquiryResponseRepository enquiryResponseRepository;

    @Override
    public EnquiryResponseDto submitEnquiry(EnquiryCreateRequest request) {
        Enquiry enquiry = new Enquiry();
        enquiry.setName(request.getName());
        enquiry.setEmail(request.getEmail());
        enquiry.setPhone(request.getPhone());
        enquiry.setSubject(request.getSubject());
        enquiry.setMessage(request.getMessage());
        enquiry.setStatus(EnquiryStatus.NEW);

        Enquiry saved = enquiryRepository.save(enquiry);
        return mapToResponse(saved);
    }

    @Override
    public EnquiryResponseDto updateStatus(Long id, EnquiryStatusUpdateRequest request) {
        Enquiry enquiry = enquiryRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Enquiry not found", "ENQUIRY_NOT_FOUND", HttpStatus.NOT_FOUND));

        validateStatusTransition(enquiry.getStatus(), request.getStatus());
        enquiry.setStatus(request.getStatus());

        Enquiry saved = enquiryRepository.save(enquiry);
        return mapToResponse(saved);
    }

    @Override
    public EnquiryResponseDto respondToEnquiry(Long id, EnquiryReplyRequest request, Long responderId) {
        Enquiry enquiry = enquiryRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Enquiry not found", "ENQUIRY_NOT_FOUND", HttpStatus.NOT_FOUND));

        EnquiryResponse response = new EnquiryResponse();
        response.setEnquiry(enquiry);
        response.setResponderId(responderId);
        response.setMessage(request.getMessage());
        enquiryResponseRepository.save(response);

        // Auto-transition to IN_PROGRESS if still NEW
        if (enquiry.getStatus() == EnquiryStatus.NEW) {
            enquiry.setStatus(EnquiryStatus.IN_PROGRESS);
            enquiryRepository.save(enquiry);
        }

        return mapToResponse(enquiry);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<EnquiryResponseDto> getEnquiries(EnquiryFilterRequest filter, Pageable pageable) {
        Page<Enquiry> page;

        if (filter != null && (filter.getSearch() != null || filter.getStatus() != null)) {
            if (filter.getSearch() != null && !filter.getSearch().isBlank() && filter.getStatus() == null) {
                page = enquiryRepository.searchByNameEmailOrSubject(filter.getSearch().trim(), pageable);
            } else if (filter.getStatus() != null && (filter.getSearch() == null || filter.getSearch().isBlank())) {
                page = enquiryRepository.findByStatusOrderByCreatedAtDesc(filter.getStatus(), pageable);
            } else {
                page = enquiryRepository.findByFilters(filter.getStatus(), filter.getSearch().trim(), pageable);
            }
        } else {
            page = enquiryRepository.findAllByOrderByCreatedAtDesc(pageable);
        }

        Page<EnquiryResponseDto> responsePage = page.map(this::mapToResponse);
        return PageResponse.from(responsePage);
    }

    @Override
    @Transactional(readOnly = true)
    public EnquiryDetailResponse getEnquiry(Long id) {
        Enquiry enquiry = enquiryRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Enquiry not found", "ENQUIRY_NOT_FOUND", HttpStatus.NOT_FOUND));

        List<EnquiryReplyResponse> responses = enquiryResponseRepository
                .findByEnquiryIdOrderByCreatedAtAsc(enquiry.getId())
                .stream()
                .map(this::mapToReplyResponse)
                .collect(Collectors.toList());

        return EnquiryDetailResponse.builder()
                .id(enquiry.getId())
                .name(enquiry.getName())
                .email(enquiry.getEmail())
                .phone(enquiry.getPhone())
                .subject(enquiry.getSubject())
                .message(enquiry.getMessage())
                .status(enquiry.getStatus())
                .responses(responses)
                .createdAt(enquiry.getCreatedAt())
                .updatedAt(enquiry.getUpdatedAt())
                .build();
    }

    private void validateStatusTransition(EnquiryStatus current, EnquiryStatus target) {
        boolean valid = switch (current) {
            case NEW -> target == EnquiryStatus.IN_PROGRESS;
            case IN_PROGRESS -> target == EnquiryStatus.RESOLVED || target == EnquiryStatus.CLOSED;
            case RESOLVED -> target == EnquiryStatus.CLOSED;
            case CLOSED -> false;
        };

        if (!valid) {
            throw new BusinessException(
                    "Invalid status transition from " + current + " to " + target,
                    "INVALID_STATUS_TRANSITION",
                    HttpStatus.BAD_REQUEST
            );
        }
    }

    private EnquiryResponseDto mapToResponse(Enquiry enquiry) {
        return EnquiryResponseDto.builder()
                .id(enquiry.getId())
                .name(enquiry.getName())
                .email(enquiry.getEmail())
                .phone(enquiry.getPhone())
                .subject(enquiry.getSubject())
                .message(enquiry.getMessage())
                .status(enquiry.getStatus())
                .createdAt(enquiry.getCreatedAt())
                .updatedAt(enquiry.getUpdatedAt())
                .build();
    }

    private EnquiryReplyResponse mapToReplyResponse(EnquiryResponse response) {
        return EnquiryReplyResponse.builder()
                .id(response.getId())
                .responderId(response.getResponderId())
                .message(response.getMessage())
                .createdAt(response.getCreatedAt())
                .build();
    }
}
