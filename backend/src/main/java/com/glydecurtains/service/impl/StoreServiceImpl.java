package com.glydecurtains.service.impl;

import com.glydecurtains.dto.request.StoreCreateRequest;
import com.glydecurtains.dto.request.StoreUpdateRequest;
import com.glydecurtains.dto.response.PageResponse;
import com.glydecurtains.dto.response.StoreResponse;
import com.glydecurtains.entity.StoreLocation;
import com.glydecurtains.exception.BusinessException;
import com.glydecurtains.repository.StoreLocationRepository;
import com.glydecurtains.service.StoreService;
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
public class StoreServiceImpl implements StoreService {

    private final StoreLocationRepository storeLocationRepository;

    @Override
    public StoreResponse createStore(StoreCreateRequest request) {
        StoreLocation store = new StoreLocation();
        store.setName(request.getName());
        store.setAddress(request.getAddress());
        store.setCity(request.getCity());
        store.setState(request.getState());
        store.setPhone(request.getPhone());
        store.setEmail(request.getEmail());
        store.setLatitude(request.getLatitude());
        store.setLongitude(request.getLongitude());
        store.setOperatingHours(request.getOperatingHours());
        store.setImageBase64(request.getImageBase64());
        store.setIsActive(true);

        StoreLocation saved = storeLocationRepository.save(store);
        return mapToResponse(saved);
    }

    @Override
    public StoreResponse updateStore(Long id, StoreUpdateRequest request) {
        StoreLocation store = storeLocationRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Store not found", "STORE_NOT_FOUND", HttpStatus.NOT_FOUND));

        if (request.getName() != null) {
            store.setName(request.getName());
        }
        if (request.getAddress() != null) {
            store.setAddress(request.getAddress());
        }
        if (request.getCity() != null) {
            store.setCity(request.getCity());
        }
        if (request.getState() != null) {
            store.setState(request.getState());
        }
        if (request.getPhone() != null) {
            store.setPhone(request.getPhone());
        }
        if (request.getEmail() != null) {
            store.setEmail(request.getEmail());
        }
        if (request.getLatitude() != null) {
            store.setLatitude(request.getLatitude());
        }
        if (request.getLongitude() != null) {
            store.setLongitude(request.getLongitude());
        }
        if (request.getOperatingHours() != null) {
            store.setOperatingHours(request.getOperatingHours());
        }
        if (request.getImageBase64() != null) {
            store.setImageBase64(request.getImageBase64());
        }
        if (request.getIsActive() != null) {
            store.setIsActive(request.getIsActive());
        }

        StoreLocation saved = storeLocationRepository.save(store);
        return mapToResponse(saved);
    }

    @Override
    public void deleteStore(Long id) {
        StoreLocation store = storeLocationRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Store not found", "STORE_NOT_FOUND", HttpStatus.NOT_FOUND));
        storeLocationRepository.delete(store);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<StoreResponse> getAllStores(Pageable pageable) {
        Page<StoreLocation> page = storeLocationRepository.findAllByOrderByNameAsc(pageable);
        Page<StoreResponse> responsePage = page.map(this::mapToResponse);
        return PageResponse.from(responsePage);
    }

    @Override
    @Transactional(readOnly = true)
    public List<StoreResponse> searchStores(String query) {
        if (query == null || query.trim().isEmpty()) {
            return List.of();
        }
        List<StoreLocation> stores = storeLocationRepository.searchByArea(query.trim());
        return stores.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<StoreResponse> listActiveStores() {
        return storeLocationRepository.findByIsActiveTrueOrderByNameAsc().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public StoreResponse getStore(Long id) {
        StoreLocation store = storeLocationRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Store not found", "STORE_NOT_FOUND", HttpStatus.NOT_FOUND));
        return mapToResponse(store);
    }

    private StoreResponse mapToResponse(StoreLocation store) {
        return StoreResponse.builder()
                .id(store.getId())
                .name(store.getName())
                .address(store.getAddress())
                .city(store.getCity())
                .state(store.getState())
                .phone(store.getPhone())
                .email(store.getEmail())
                .latitude(store.getLatitude())
                .longitude(store.getLongitude())
                .operatingHours(store.getOperatingHours())
                .imageBase64(store.getImageBase64())
                .isActive(store.getIsActive())
                .createdAt(store.getCreatedAt())
                .updatedAt(store.getUpdatedAt())
                .build();
    }
}
