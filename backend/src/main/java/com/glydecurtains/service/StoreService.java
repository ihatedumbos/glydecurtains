package com.glydecurtains.service;

import com.glydecurtains.dto.request.StoreCreateRequest;
import com.glydecurtains.dto.request.StoreUpdateRequest;
import com.glydecurtains.dto.response.PageResponse;
import com.glydecurtains.dto.response.StoreResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface StoreService {

    StoreResponse createStore(StoreCreateRequest request);

    StoreResponse updateStore(Long id, StoreUpdateRequest request);

    void deleteStore(Long id);

    PageResponse<StoreResponse> getAllStores(Pageable pageable);

    List<StoreResponse> searchStores(String query);

    StoreResponse getStore(Long id);
}
