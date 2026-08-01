package com.glydecurtains.service;

import com.glydecurtains.dto.request.StoreCreateRequest;
import com.glydecurtains.dto.request.StoreUpdateRequest;
import com.glydecurtains.dto.response.PageResponse;
import com.glydecurtains.dto.response.StoreResponse;
import com.glydecurtains.entity.StoreLocation;
import com.glydecurtains.exception.BusinessException;
import com.glydecurtains.repository.StoreLocationRepository;
import com.glydecurtains.service.impl.StoreServiceImpl;
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
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class StoreServiceTest {

    @Mock
    private StoreLocationRepository storeLocationRepository;

    @InjectMocks
    private StoreServiceImpl storeService;

    private StoreLocation sampleStore;

    @BeforeEach
    void setUp() {
        sampleStore = new StoreLocation();
        sampleStore.setId(1L);
        sampleStore.setName("Glyde Main Store");
        sampleStore.setAddress("123 Main Street");
        sampleStore.setCity("Mumbai");
        sampleStore.setState("Maharashtra");
        sampleStore.setPhone("+91-9876543210");
        sampleStore.setEmail("store@glyde.com");
        sampleStore.setLatitude(19.076);
        sampleStore.setLongitude(72.8777);
        sampleStore.setOperatingHours("{\"mon-fri\": \"9:00-18:00\"}");
        sampleStore.setImageBase64("base64-image-data");
        sampleStore.setIsActive(true);
    }

    @Nested
    @DisplayName("Create Store")
    class CreateStoreTests {

        @Test
        @DisplayName("should create store successfully with valid request")
        void createStore_withValidRequest_shouldReturnStoreResponse() {
            StoreCreateRequest request = new StoreCreateRequest();
            request.setName("Glyde Main Store");
            request.setAddress("123 Main Street");
            request.setCity("Mumbai");
            request.setState("Maharashtra");
            request.setPhone("+91-9876543210");
            request.setEmail("store@glyde.com");
            request.setLatitude(19.076);
            request.setLongitude(72.8777);
            request.setOperatingHours("{\"mon-fri\": \"9:00-18:00\"}");
            request.setImageBase64("base64-image-data");

            when(storeLocationRepository.save(any(StoreLocation.class))).thenReturn(sampleStore);

            StoreResponse result = storeService.createStore(request);

            assertThat(result).isNotNull();
            assertThat(result.getId()).isEqualTo(1L);
            assertThat(result.getName()).isEqualTo("Glyde Main Store");
            assertThat(result.getAddress()).isEqualTo("123 Main Street");
            assertThat(result.getCity()).isEqualTo("Mumbai");
            assertThat(result.getState()).isEqualTo("Maharashtra");
            assertThat(result.getPhone()).isEqualTo("+91-9876543210");
            assertThat(result.getEmail()).isEqualTo("store@glyde.com");
            assertThat(result.getLatitude()).isEqualTo(19.076);
            assertThat(result.getLongitude()).isEqualTo(72.8777);
            assertThat(result.getIsActive()).isTrue();

            verify(storeLocationRepository).save(any(StoreLocation.class));
        }

        @Test
        @DisplayName("should set isActive to true by default on creation")
        void createStore_shouldSetIsActiveToTrue() {
            StoreCreateRequest request = new StoreCreateRequest();
            request.setName("New Store");
            request.setAddress("456 Avenue");
            request.setCity("Delhi");
            request.setState("Delhi");
            request.setPhone("+91-1234567890");

            StoreLocation savedStore = new StoreLocation();
            savedStore.setId(2L);
            savedStore.setName("New Store");
            savedStore.setAddress("456 Avenue");
            savedStore.setCity("Delhi");
            savedStore.setState("Delhi");
            savedStore.setPhone("+91-1234567890");
            savedStore.setIsActive(true);

            when(storeLocationRepository.save(any(StoreLocation.class))).thenReturn(savedStore);

            StoreResponse result = storeService.createStore(request);

            assertThat(result.getIsActive()).isTrue();
        }
    }

    @Nested
    @DisplayName("Update Store")
    class UpdateStoreTests {

        @Test
        @DisplayName("should update store successfully with partial fields")
        void updateStore_withPartialFields_shouldUpdateOnlyProvidedFields() {
            StoreUpdateRequest request = new StoreUpdateRequest();
            request.setName("Updated Store Name");
            request.setCity("Pune");

            StoreLocation updatedStore = new StoreLocation();
            updatedStore.setId(1L);
            updatedStore.setName("Updated Store Name");
            updatedStore.setAddress("123 Main Street");
            updatedStore.setCity("Pune");
            updatedStore.setState("Maharashtra");
            updatedStore.setPhone("+91-9876543210");
            updatedStore.setEmail("store@glyde.com");
            updatedStore.setIsActive(true);

            when(storeLocationRepository.findById(1L)).thenReturn(Optional.of(sampleStore));
            when(storeLocationRepository.save(any(StoreLocation.class))).thenReturn(updatedStore);

            StoreResponse result = storeService.updateStore(1L, request);

            assertThat(result).isNotNull();
            assertThat(result.getName()).isEqualTo("Updated Store Name");
            assertThat(result.getCity()).isEqualTo("Pune");
            assertThat(result.getAddress()).isEqualTo("123 Main Street");

            verify(storeLocationRepository).findById(1L);
            verify(storeLocationRepository).save(any(StoreLocation.class));
        }

        @Test
        @DisplayName("should throw BusinessException when store not found for update")
        void updateStore_whenNotFound_shouldThrowBusinessException() {
            StoreUpdateRequest request = new StoreUpdateRequest();
            request.setName("Updated Name");

            when(storeLocationRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> storeService.updateStore(99L, request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Store not found")
                    .extracting("errorCode")
                    .isEqualTo("STORE_NOT_FOUND");

            verify(storeLocationRepository).findById(99L);
            verify(storeLocationRepository, never()).save(any(StoreLocation.class));
        }

        @Test
        @DisplayName("should not update fields that are null in request")
        void updateStore_withNullFields_shouldPreserveExistingValues() {
            StoreUpdateRequest request = new StoreUpdateRequest();
            // All fields are null - nothing should be updated

            when(storeLocationRepository.findById(1L)).thenReturn(Optional.of(sampleStore));
            when(storeLocationRepository.save(any(StoreLocation.class))).thenReturn(sampleStore);

            StoreResponse result = storeService.updateStore(1L, request);

            assertThat(result.getName()).isEqualTo("Glyde Main Store");
            assertThat(result.getCity()).isEqualTo("Mumbai");
            assertThat(result.getPhone()).isEqualTo("+91-9876543210");
        }
    }

    @Nested
    @DisplayName("Delete Store")
    class DeleteStoreTests {

        @Test
        @DisplayName("should delete store successfully when it exists")
        void deleteStore_whenExists_shouldDeleteSuccessfully() {
            when(storeLocationRepository.findById(1L)).thenReturn(Optional.of(sampleStore));

            storeService.deleteStore(1L);

            verify(storeLocationRepository).findById(1L);
            verify(storeLocationRepository).delete(sampleStore);
        }

        @Test
        @DisplayName("should throw BusinessException when store not found for deletion")
        void deleteStore_whenNotFound_shouldThrowBusinessException() {
            when(storeLocationRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> storeService.deleteStore(99L))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Store not found")
                    .extracting("errorCode")
                    .isEqualTo("STORE_NOT_FOUND");

            verify(storeLocationRepository, never()).delete(any(StoreLocation.class));
        }
    }

    @Nested
    @DisplayName("Get All Stores")
    class GetAllStoresTests {

        @Test
        @DisplayName("should return paginated stores ordered by name")
        void getAllStores_shouldReturnPageResponse() {
            StoreLocation store2 = new StoreLocation();
            store2.setId(2L);
            store2.setName("Branch Store");
            store2.setAddress("789 Road");
            store2.setCity("Pune");
            store2.setState("Maharashtra");
            store2.setPhone("+91-1111111111");
            store2.setIsActive(true);

            Pageable pageable = PageRequest.of(0, 20);
            Page<StoreLocation> page = new PageImpl<>(List.of(store2, sampleStore), pageable, 2);

            when(storeLocationRepository.findAllByOrderByNameAsc(pageable)).thenReturn(page);

            PageResponse<StoreResponse> result = storeService.getAllStores(pageable);

            assertThat(result).isNotNull();
            assertThat(result.getContent()).hasSize(2);
            assertThat(result.getTotalElements()).isEqualTo(2);
            assertThat(result.getPage()).isEqualTo(0);
            assertThat(result.getSize()).isEqualTo(20);

            verify(storeLocationRepository).findAllByOrderByNameAsc(pageable);
        }

        @Test
        @DisplayName("should return empty page when no stores exist")
        void getAllStores_whenEmpty_shouldReturnEmptyPageResponse() {
            Pageable pageable = PageRequest.of(0, 20);
            Page<StoreLocation> emptyPage = new PageImpl<>(List.of(), pageable, 0);

            when(storeLocationRepository.findAllByOrderByNameAsc(pageable)).thenReturn(emptyPage);

            PageResponse<StoreResponse> result = storeService.getAllStores(pageable);

            assertThat(result).isNotNull();
            assertThat(result.getContent()).isEmpty();
            assertThat(result.getTotalElements()).isEqualTo(0);
        }
    }

    @Nested
    @DisplayName("Toggle Visibility (isActive)")
    class ToggleVisibilityTests {

        @Test
        @DisplayName("should deactivate an active store via update")
        void toggleVisibility_deactivate_shouldSetIsActiveToFalse() {
            StoreUpdateRequest request = new StoreUpdateRequest();
            request.setIsActive(false);

            StoreLocation deactivatedStore = new StoreLocation();
            deactivatedStore.setId(1L);
            deactivatedStore.setName("Glyde Main Store");
            deactivatedStore.setAddress("123 Main Street");
            deactivatedStore.setCity("Mumbai");
            deactivatedStore.setState("Maharashtra");
            deactivatedStore.setPhone("+91-9876543210");
            deactivatedStore.setEmail("store@glyde.com");
            deactivatedStore.setIsActive(false);

            when(storeLocationRepository.findById(1L)).thenReturn(Optional.of(sampleStore));
            when(storeLocationRepository.save(any(StoreLocation.class))).thenReturn(deactivatedStore);

            StoreResponse result = storeService.updateStore(1L, request);

            assertThat(result.getIsActive()).isFalse();
            verify(storeLocationRepository).save(any(StoreLocation.class));
        }

        @Test
        @DisplayName("should activate an inactive store via update")
        void toggleVisibility_activate_shouldSetIsActiveToTrue() {
            sampleStore.setIsActive(false); // start as inactive

            StoreUpdateRequest request = new StoreUpdateRequest();
            request.setIsActive(true);

            StoreLocation activatedStore = new StoreLocation();
            activatedStore.setId(1L);
            activatedStore.setName("Glyde Main Store");
            activatedStore.setAddress("123 Main Street");
            activatedStore.setCity("Mumbai");
            activatedStore.setState("Maharashtra");
            activatedStore.setPhone("+91-9876543210");
            activatedStore.setEmail("store@glyde.com");
            activatedStore.setIsActive(true);

            when(storeLocationRepository.findById(1L)).thenReturn(Optional.of(sampleStore));
            when(storeLocationRepository.save(any(StoreLocation.class))).thenReturn(activatedStore);

            StoreResponse result = storeService.updateStore(1L, request);

            assertThat(result.getIsActive()).isTrue();
        }

        @Test
        @DisplayName("should throw BusinessException when toggling non-existent store")
        void toggleVisibility_whenStoreNotFound_shouldThrowBusinessException() {
            StoreUpdateRequest request = new StoreUpdateRequest();
            request.setIsActive(true);

            when(storeLocationRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> storeService.updateStore(99L, request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Store not found")
                    .extracting("errorCode")
                    .isEqualTo("STORE_NOT_FOUND");
        }
    }
}
