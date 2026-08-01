package com.glydecurtains.controller;

import com.glydecurtains.dto.request.StoreCreateRequest;
import com.glydecurtains.dto.request.StoreUpdateRequest;
import com.glydecurtains.dto.response.ApiResponse;
import com.glydecurtains.dto.response.PageResponse;
import com.glydecurtains.dto.response.StoreResponse;
import com.glydecurtains.security.RequiresPermission;
import com.glydecurtains.service.StoreService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stores")
@RequiredArgsConstructor
public class StoreController {

    private final StoreService storeService;

    @PostMapping
    @RequiresPermission(entity = "stores", operation = "CREATE")
    public ResponseEntity<ApiResponse<StoreResponse>> createStore(
            @Valid @RequestBody StoreCreateRequest request) {
        StoreResponse response = storeService.createStore(request);
        return ResponseEntity.status(201).body(ApiResponse.created("Store created successfully", response));
    }

    @PutMapping("/{id}")
    @RequiresPermission(entity = "stores", operation = "UPDATE")
    public ResponseEntity<ApiResponse<StoreResponse>> updateStore(
            @PathVariable Long id,
            @Valid @RequestBody StoreUpdateRequest request) {
        StoreResponse response = storeService.updateStore(id, request);
        return ResponseEntity.ok(ApiResponse.success("Store updated successfully", response));
    }

    @DeleteMapping("/{id}")
    @RequiresPermission(entity = "stores", operation = "DELETE")
    public ResponseEntity<ApiResponse<Void>> deleteStore(@PathVariable Long id) {
        storeService.deleteStore(id);
        return ResponseEntity.ok(ApiResponse.noContent());
    }

    @GetMapping("/{id}")
    @RequiresPermission(entity = "stores", operation = "READ")
    public ResponseEntity<ApiResponse<StoreResponse>> getStore(@PathVariable Long id) {
        StoreResponse response = storeService.getStore(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping
    @RequiresPermission(entity = "stores", operation = "READ")
    public ResponseEntity<ApiResponse<PageResponse<StoreResponse>>> getAllStores(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        PageResponse<StoreResponse> response = storeService.getAllStores(pageable);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/public/search")
    public ResponseEntity<ApiResponse<List<StoreResponse>>> searchStores(
            @RequestParam String query) {
        List<StoreResponse> response = storeService.searchStores(query);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
