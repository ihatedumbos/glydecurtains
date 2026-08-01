package com.glydecurtains.service;

import com.glydecurtains.dto.request.EnquiryCreateRequest;
import com.glydecurtains.dto.request.EnquiryFilterRequest;
import com.glydecurtains.dto.request.EnquiryReplyRequest;
import com.glydecurtains.dto.request.EnquiryStatusUpdateRequest;
import com.glydecurtains.dto.response.EnquiryDetailResponse;
import com.glydecurtains.dto.response.EnquiryResponseDto;
import com.glydecurtains.dto.response.PageResponse;
import com.glydecurtains.entity.Enquiry;
import com.glydecurtains.entity.EnquiryResponse;
import com.glydecurtains.entity.enums.EnquiryStatus;
import com.glydecurtains.exception.BusinessException;
import com.glydecurtains.repository.EnquiryRepository;
import com.glydecurtains.repository.EnquiryResponseRepository;
import com.glydecurtains.service.impl.EnquiryServiceImpl;
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

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EnquiryServiceTest {

    @Mock
    private EnquiryRepository enquiryRepository;

    @Mock
    private EnquiryResponseRepository enquiryResponseRepository;

    @InjectMocks
    private EnquiryServiceImpl enquiryService;

    private Enquiry sampleEnquiry;

    @BeforeEach
    void setUp() {
        sampleEnquiry = new Enquiry();
        sampleEnquiry.setId(1L);
        sampleEnquiry.setName("John Doe");
        sampleEnquiry.setEmail("john@example.com");
        sampleEnquiry.setPhone("+1234567890");
        sampleEnquiry.setSubject("Product Inquiry");
        sampleEnquiry.setMessage("I would like to know more about your curtains.");
        sampleEnquiry.setStatus(EnquiryStatus.NEW);
        sampleEnquiry.setCreatedAt(LocalDateTime.now());
        sampleEnquiry.setUpdatedAt(LocalDateTime.now());
    }

    @Nested
    @DisplayName("Create Enquiry")
    class CreateEnquiryTests {

        @Test
        @DisplayName("should create enquiry successfully with valid request")
        void submitEnquiry_withValidRequest_shouldReturnEnquiryResponse() {
            EnquiryCreateRequest request = new EnquiryCreateRequest(
                    "Jane Smith", "jane@example.com", "+9876543210",
                    "Pricing Question", "What are your prices for blackout curtains?"
            );

            Enquiry savedEnquiry = new Enquiry();
            savedEnquiry.setId(2L);
            savedEnquiry.setName("Jane Smith");
            savedEnquiry.setEmail("jane@example.com");
            savedEnquiry.setPhone("+9876543210");
            savedEnquiry.setSubject("Pricing Question");
            savedEnquiry.setMessage("What are your prices for blackout curtains?");
            savedEnquiry.setStatus(EnquiryStatus.NEW);
            savedEnquiry.setCreatedAt(LocalDateTime.now());
            savedEnquiry.setUpdatedAt(LocalDateTime.now());

            when(enquiryRepository.save(any(Enquiry.class))).thenReturn(savedEnquiry);

            EnquiryResponseDto result = enquiryService.submitEnquiry(request);

            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo(2L);
            assertThat(result.getName()).isEqualTo("Jane Smith");
            assertThat(result.getEmail()).isEqualTo("jane@example.com");
            assertThat(result.getPhone()).isEqualTo("+9876543210");
            assertThat(result.getSubject()).isEqualTo("Pricing Question");
            assertThat(result.getMessage()).isEqualTo("What are your prices for blackout curtains?");
            assertThat(result.getStatus()).isEqualTo(EnquiryStatus.NEW);

            verify(enquiryRepository).save(any(Enquiry.class));
        }

        @Test
        @DisplayName("should set status to NEW on creation")
        void submitEnquiry_shouldSetStatusToNew() {
            EnquiryCreateRequest request = new EnquiryCreateRequest(
                    "Bob", "bob@example.com", null, "Help", "Need help"
            );

            Enquiry savedEnquiry = new Enquiry();
            savedEnquiry.setId(3L);
            savedEnquiry.setName("Bob");
            savedEnquiry.setEmail("bob@example.com");
            savedEnquiry.setSubject("Help");
            savedEnquiry.setMessage("Need help");
            savedEnquiry.setStatus(EnquiryStatus.NEW);
            savedEnquiry.setCreatedAt(LocalDateTime.now());
            savedEnquiry.setUpdatedAt(LocalDateTime.now());

            when(enquiryRepository.save(any(Enquiry.class))).thenReturn(savedEnquiry);

            EnquiryResponseDto result = enquiryService.submitEnquiry(request);

            assertThat(result.getStatus()).isEqualTo(EnquiryStatus.NEW);
        }
    }

    @Nested
    @DisplayName("Update Status")
    class UpdateStatusTests {

        @Test
        @DisplayName("should transition from NEW to IN_PROGRESS")
        void updateStatus_fromNewToInProgress_shouldSucceed() {
            EnquiryStatusUpdateRequest request = new EnquiryStatusUpdateRequest(EnquiryStatus.IN_PROGRESS);

            Enquiry updatedEnquiry = new Enquiry();
            updatedEnquiry.setId(1L);
            updatedEnquiry.setName("John Doe");
            updatedEnquiry.setEmail("john@example.com");
            updatedEnquiry.setSubject("Product Inquiry");
            updatedEnquiry.setMessage("I would like to know more about your curtains.");
            updatedEnquiry.setStatus(EnquiryStatus.IN_PROGRESS);
            updatedEnquiry.setCreatedAt(sampleEnquiry.getCreatedAt());
            updatedEnquiry.setUpdatedAt(LocalDateTime.now());

            when(enquiryRepository.findById(1L)).thenReturn(Optional.of(sampleEnquiry));
            when(enquiryRepository.save(any(Enquiry.class))).thenReturn(updatedEnquiry);

            EnquiryResponseDto result = enquiryService.updateStatus(1L, request);

            assertThat(result.getStatus()).isEqualTo(EnquiryStatus.IN_PROGRESS);
            verify(enquiryRepository).save(any(Enquiry.class));
        }

        @Test
        @DisplayName("should transition from IN_PROGRESS to RESOLVED")
        void updateStatus_fromInProgressToResolved_shouldSucceed() {
            sampleEnquiry.setStatus(EnquiryStatus.IN_PROGRESS);
            EnquiryStatusUpdateRequest request = new EnquiryStatusUpdateRequest(EnquiryStatus.RESOLVED);

            Enquiry updatedEnquiry = new Enquiry();
            updatedEnquiry.setId(1L);
            updatedEnquiry.setName("John Doe");
            updatedEnquiry.setEmail("john@example.com");
            updatedEnquiry.setSubject("Product Inquiry");
            updatedEnquiry.setMessage("I would like to know more about your curtains.");
            updatedEnquiry.setStatus(EnquiryStatus.RESOLVED);
            updatedEnquiry.setCreatedAt(sampleEnquiry.getCreatedAt());
            updatedEnquiry.setUpdatedAt(LocalDateTime.now());

            when(enquiryRepository.findById(1L)).thenReturn(Optional.of(sampleEnquiry));
            when(enquiryRepository.save(any(Enquiry.class))).thenReturn(updatedEnquiry);

            EnquiryResponseDto result = enquiryService.updateStatus(1L, request);

            assertThat(result.getStatus()).isEqualTo(EnquiryStatus.RESOLVED);
        }

        @Test
        @DisplayName("should transition from IN_PROGRESS to CLOSED")
        void updateStatus_fromInProgressToClosed_shouldSucceed() {
            sampleEnquiry.setStatus(EnquiryStatus.IN_PROGRESS);
            EnquiryStatusUpdateRequest request = new EnquiryStatusUpdateRequest(EnquiryStatus.CLOSED);

            Enquiry updatedEnquiry = new Enquiry();
            updatedEnquiry.setId(1L);
            updatedEnquiry.setName("John Doe");
            updatedEnquiry.setEmail("john@example.com");
            updatedEnquiry.setSubject("Product Inquiry");
            updatedEnquiry.setMessage("I would like to know more about your curtains.");
            updatedEnquiry.setStatus(EnquiryStatus.CLOSED);
            updatedEnquiry.setCreatedAt(sampleEnquiry.getCreatedAt());
            updatedEnquiry.setUpdatedAt(LocalDateTime.now());

            when(enquiryRepository.findById(1L)).thenReturn(Optional.of(sampleEnquiry));
            when(enquiryRepository.save(any(Enquiry.class))).thenReturn(updatedEnquiry);

            EnquiryResponseDto result = enquiryService.updateStatus(1L, request);

            assertThat(result.getStatus()).isEqualTo(EnquiryStatus.CLOSED);
        }

        @Test
        @DisplayName("should throw BusinessException for invalid transition NEW to RESOLVED")
        void updateStatus_fromNewToResolved_shouldThrowException() {
            EnquiryStatusUpdateRequest request = new EnquiryStatusUpdateRequest(EnquiryStatus.RESOLVED);

            when(enquiryRepository.findById(1L)).thenReturn(Optional.of(sampleEnquiry));

            assertThatThrownBy(() -> enquiryService.updateStatus(1L, request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Invalid status transition")
                    .extracting("errorCode")
                    .isEqualTo("INVALID_STATUS_TRANSITION");

            verify(enquiryRepository, never()).save(any(Enquiry.class));
        }

        @Test
        @DisplayName("should throw BusinessException for invalid transition CLOSED to any")
        void updateStatus_fromClosed_shouldThrowException() {
            sampleEnquiry.setStatus(EnquiryStatus.CLOSED);
            EnquiryStatusUpdateRequest request = new EnquiryStatusUpdateRequest(EnquiryStatus.IN_PROGRESS);

            when(enquiryRepository.findById(1L)).thenReturn(Optional.of(sampleEnquiry));

            assertThatThrownBy(() -> enquiryService.updateStatus(1L, request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Invalid status transition")
                    .extracting("errorCode")
                    .isEqualTo("INVALID_STATUS_TRANSITION");
        }

        @Test
        @DisplayName("should throw BusinessException when enquiry not found")
        void updateStatus_whenNotFound_shouldThrowException() {
            EnquiryStatusUpdateRequest request = new EnquiryStatusUpdateRequest(EnquiryStatus.IN_PROGRESS);

            when(enquiryRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> enquiryService.updateStatus(99L, request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Enquiry not found")
                    .extracting("errorCode")
                    .isEqualTo("ENQUIRY_NOT_FOUND");
        }
    }

    @Nested
    @DisplayName("Respond to Enquiry (Assign to Employee)")
    class RespondToEnquiryTests {

        @Test
        @DisplayName("should create response and auto-transition status from NEW to IN_PROGRESS")
        void respondToEnquiry_whenStatusNew_shouldAutoTransitionToInProgress() {
            EnquiryReplyRequest request = new EnquiryReplyRequest("Thank you for your enquiry. We will get back to you.");
            Long responderId = 10L;

            when(enquiryRepository.findById(1L)).thenReturn(Optional.of(sampleEnquiry));
            when(enquiryResponseRepository.save(any(EnquiryResponse.class))).thenReturn(new EnquiryResponse());
            when(enquiryRepository.save(any(Enquiry.class))).thenReturn(sampleEnquiry);

            EnquiryResponseDto result = enquiryService.respondToEnquiry(1L, request, responderId);

            assertThat(result).isNotNull();
            verify(enquiryResponseRepository).save(any(EnquiryResponse.class));
            verify(enquiryRepository).save(any(Enquiry.class));
        }

        @Test
        @DisplayName("should create response without changing status when already IN_PROGRESS")
        void respondToEnquiry_whenStatusInProgress_shouldNotChangeStatus() {
            sampleEnquiry.setStatus(EnquiryStatus.IN_PROGRESS);
            EnquiryReplyRequest request = new EnquiryReplyRequest("Follow-up response");
            Long responderId = 10L;

            when(enquiryRepository.findById(1L)).thenReturn(Optional.of(sampleEnquiry));
            when(enquiryResponseRepository.save(any(EnquiryResponse.class))).thenReturn(new EnquiryResponse());

            EnquiryResponseDto result = enquiryService.respondToEnquiry(1L, request, responderId);

            assertThat(result).isNotNull();
            verify(enquiryResponseRepository).save(any(EnquiryResponse.class));
            verify(enquiryRepository, never()).save(any(Enquiry.class));
        }

        @Test
        @DisplayName("should throw BusinessException when enquiry not found")
        void respondToEnquiry_whenNotFound_shouldThrowException() {
            EnquiryReplyRequest request = new EnquiryReplyRequest("Response message");

            when(enquiryRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> enquiryService.respondToEnquiry(99L, request, 10L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Enquiry not found")
                    .extracting("errorCode")
                    .isEqualTo("ENQUIRY_NOT_FOUND");
        }
    }

    @Nested
    @DisplayName("Get Enquiries Paginated")
    class GetEnquiriesPaginatedTests {

        @Test
        @DisplayName("should return all enquiries paginated when no filters")
        void getEnquiries_withNoFilters_shouldReturnAllPaginated() {
            Pageable pageable = PageRequest.of(0, 20);
            Page<Enquiry> page = new PageImpl<>(List.of(sampleEnquiry), pageable, 1);

            when(enquiryRepository.findAllByOrderByCreatedAtDesc(pageable)).thenReturn(page);

            PageResponse<EnquiryResponseDto> result = enquiryService.getEnquiries(null, pageable);

            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getName()).isEqualTo("John Doe");
            assertThat(result.getTotalElements()).isEqualTo(1);
            assertThat(result.getPage()).isEqualTo(0);
            assertThat(result.getSize()).isEqualTo(20);

            verify(enquiryRepository).findAllByOrderByCreatedAtDesc(pageable);
        }

        @Test
        @DisplayName("should return enquiries filtered by status")
        void getEnquiries_withStatusFilter_shouldReturnFiltered() {
            Pageable pageable = PageRequest.of(0, 20);
            EnquiryFilterRequest filter = new EnquiryFilterRequest(EnquiryStatus.NEW, null);
            Page<Enquiry> page = new PageImpl<>(List.of(sampleEnquiry), pageable, 1);

            when(enquiryRepository.findByStatusOrderByCreatedAtDesc(EnquiryStatus.NEW, pageable)).thenReturn(page);

            PageResponse<EnquiryResponseDto> result = enquiryService.getEnquiries(filter, pageable);

            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getStatus()).isEqualTo(EnquiryStatus.NEW);

            verify(enquiryRepository).findByStatusOrderByCreatedAtDesc(EnquiryStatus.NEW, pageable);
        }

        @Test
        @DisplayName("should return enquiries filtered by search term")
        void getEnquiries_withSearchFilter_shouldReturnFiltered() {
            Pageable pageable = PageRequest.of(0, 20);
            EnquiryFilterRequest filter = new EnquiryFilterRequest(null, "John");
            Page<Enquiry> page = new PageImpl<>(List.of(sampleEnquiry), pageable, 1);

            when(enquiryRepository.searchByNameEmailOrSubject("John", pageable)).thenReturn(page);

            PageResponse<EnquiryResponseDto> result = enquiryService.getEnquiries(filter, pageable);

            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);

            verify(enquiryRepository).searchByNameEmailOrSubject("John", pageable);
        }

        @Test
        @DisplayName("should return enquiries filtered by both status and search")
        void getEnquiries_withStatusAndSearch_shouldReturnFiltered() {
            Pageable pageable = PageRequest.of(0, 20);
            EnquiryFilterRequest filter = new EnquiryFilterRequest(EnquiryStatus.NEW, "John");
            Page<Enquiry> page = new PageImpl<>(List.of(sampleEnquiry), pageable, 1);

            when(enquiryRepository.findByFilters(EnquiryStatus.NEW, "John", pageable)).thenReturn(page);

            PageResponse<EnquiryResponseDto> result = enquiryService.getEnquiries(filter, pageable);

            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(1);

            verify(enquiryRepository).findByFilters(EnquiryStatus.NEW, "John", pageable);
        }

        @Test
        @DisplayName("should return empty page when no enquiries match")
        void getEnquiries_withNoMatches_shouldReturnEmptyPage() {
            Pageable pageable = PageRequest.of(0, 20);
            Page<Enquiry> emptyPage = new PageImpl<>(Collections.emptyList(), pageable, 0);

            when(enquiryRepository.findAllByOrderByCreatedAtDesc(pageable)).thenReturn(emptyPage);

            PageResponse<EnquiryResponseDto> result = enquiryService.getEnquiries(null, pageable);

            assertThat(result).isNotNull();
            assertThat(result.getContent()).isEmpty();
            assertThat(result.getTotalElements()).isEqualTo(0);
        }
    }

    @Nested
    @DisplayName("Get Enquiry Detail")
    class GetEnquiryDetailTests {

        @Test
        @DisplayName("should return enquiry detail with responses")
        void getEnquiry_shouldReturnDetailWithResponses() {
            EnquiryResponse response = new EnquiryResponse();
            response.setId(1L);
            response.setEnquiry(sampleEnquiry);
            response.setResponderId(10L);
            response.setMessage("We will assist you shortly.");
            response.setCreatedAt(LocalDateTime.now());

            when(enquiryRepository.findById(1L)).thenReturn(Optional.of(sampleEnquiry));
            when(enquiryResponseRepository.findByEnquiryIdOrderByCreatedAtAsc(1L))
                    .thenReturn(List.of(response));

            EnquiryDetailResponse result = enquiryService.getEnquiry(1L);

            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo(1L);
            assertThat(result.getName()).isEqualTo("John Doe");
            assertThat(result.getEmail()).isEqualTo("john@example.com");
            assertThat(result.getSubject()).isEqualTo("Product Inquiry");
            assertThat(result.getStatus()).isEqualTo(EnquiryStatus.NEW);
            assertThat(result.getResponses()).hasSize(1);
            assertThat(result.getResponses().get(0).getResponderId()).isEqualTo(10L);
            assertThat(result.getResponses().get(0).getMessage()).isEqualTo("We will assist you shortly.");
        }

        @Test
        @DisplayName("should throw BusinessException when enquiry not found")
        void getEnquiry_whenNotFound_shouldThrowException() {
            when(enquiryRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> enquiryService.getEnquiry(99L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Enquiry not found")
                    .extracting("errorCode")
                    .isEqualTo("ENQUIRY_NOT_FOUND");
        }
    }
}
