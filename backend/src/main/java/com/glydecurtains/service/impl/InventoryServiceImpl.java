package com.glydecurtains.service.impl;

import com.glydecurtains.dto.request.StockAdjustmentRequest;
import com.glydecurtains.dto.request.ThresholdUpdateRequest;
import com.glydecurtains.dto.response.PageResponse;
import com.glydecurtains.dto.response.StockAdjustmentResponse;
import com.glydecurtains.entity.Product;
import com.glydecurtains.entity.StockAdjustment;
import com.glydecurtains.entity.enums.AdjustmentType;
import com.glydecurtains.exception.BusinessException;
import com.glydecurtains.repository.ProductRepository;
import com.glydecurtains.repository.StockAdjustmentRepository;
import com.glydecurtains.service.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class InventoryServiceImpl implements InventoryService {

    private final ProductRepository productRepository;
    private final StockAdjustmentRepository stockAdjustmentRepository;

    @Override
    @Transactional
    public StockAdjustmentResponse adjustStock(StockAdjustmentRequest request) {
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new BusinessException(
                        "Product not found with ID: " + request.getProductId(),
                        "PRODUCT_NOT_FOUND",
                        HttpStatus.NOT_FOUND));

        int currentStock = product.getStockQuantity();
        int newStock = calculateNewStock(currentStock, request.getAdjustmentType(), request.getQuantity());

        if (newStock < 0) {
            throw new BusinessException(
                    "Insufficient stock. Current stock: " + currentStock + ", requested removal: " + request.getQuantity(),
                    "INSUFFICIENT_STOCK");
        }

        product.setStockQuantity(newStock);
        productRepository.save(product);

        StockAdjustment adjustment = new StockAdjustment();
        adjustment.setProductId(request.getProductId());
        adjustment.setAdjustmentType(request.getAdjustmentType());
        adjustment.setQuantity(request.getQuantity());
        adjustment.setResultingStock(newStock);
        adjustment.setReason(request.getReason());
        adjustment.setPerformedBy(getCurrentUserId());

        StockAdjustment saved = stockAdjustmentRepository.save(adjustment);
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<StockAdjustmentResponse> getAdjustmentHistory(Long productId, Pageable pageable) {
        if (!productRepository.existsById(productId)) {
            throw new BusinessException(
                    "Product not found with ID: " + productId,
                    "PRODUCT_NOT_FOUND",
                    HttpStatus.NOT_FOUND);
        }

        Page<StockAdjustment> page = stockAdjustmentRepository.findByProductIdOrderByCreatedAtDesc(productId, pageable);
        Page<StockAdjustmentResponse> responsePage = page.map(this::toResponse);
        return PageResponse.from(responsePage);
    }

    @Override
    @Transactional
    public void updateLowStockThreshold(Long productId, ThresholdUpdateRequest request) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new BusinessException(
                        "Product not found with ID: " + productId,
                        "PRODUCT_NOT_FOUND",
                        HttpStatus.NOT_FOUND));

        if (request.getThreshold() < 0) {
            throw new BusinessException("Threshold must be non-negative", "INVALID_THRESHOLD");
        }

        product.setLowStockThreshold(request.getThreshold());
        productRepository.save(product);
    }

    @Override
    @Transactional
    public List<StockAdjustmentResponse> bulkAdjustStock(List<StockAdjustmentRequest> requests) {
        List<StockAdjustmentResponse> responses = new ArrayList<>();

        for (StockAdjustmentRequest request : requests) {
            StockAdjustmentResponse response = adjustStock(request);
            responses.add(response);
        }

        return responses;
    }

    @Override
    @Transactional
    public List<StockAdjustmentResponse> bulkAdjustFromCsv(MultipartFile file) {
        List<StockAdjustmentRequest> requests = parseCsvFile(file);
        return bulkAdjustStock(requests);
    }

    private List<StockAdjustmentRequest> parseCsvFile(MultipartFile file) {
        List<StockAdjustmentRequest> requests = new ArrayList<>();

        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {

            String line;
            boolean isHeader = true;

            while ((line = reader.readLine()) != null) {
                if (isHeader) {
                    isHeader = false;
                    continue;
                }

                String trimmedLine = line.trim();
                if (trimmedLine.isEmpty()) {
                    continue;
                }

                String[] columns = trimmedLine.split(",", -1);
                if (columns.length < 4) {
                    throw new BusinessException(
                            "Invalid CSV format. Expected columns: productId, adjustmentType, quantity, reason",
                            "INVALID_CSV_FORMAT");
                }

                try {
                    StockAdjustmentRequest request = new StockAdjustmentRequest();
                    request.setProductId(Long.parseLong(columns[0].trim()));
                    request.setAdjustmentType(AdjustmentType.valueOf(columns[1].trim().toUpperCase()));
                    request.setQuantity(Integer.parseInt(columns[2].trim()));
                    request.setReason(columns[3].trim());

                    if (request.getQuantity() < 0) {
                        throw new BusinessException(
                                "Quantity must be non-negative in CSV row for product: " + request.getProductId(),
                                "INVALID_CSV_DATA");
                    }

                    if (request.getReason().isBlank()) {
                        throw new BusinessException(
                                "Reason is required in CSV row for product: " + request.getProductId(),
                                "INVALID_CSV_DATA");
                    }

                    requests.add(request);
                } catch (NumberFormatException e) {
                    throw new BusinessException(
                            "Invalid number format in CSV row: " + trimmedLine,
                            "INVALID_CSV_DATA");
                } catch (IllegalArgumentException e) {
                    throw new BusinessException(
                            "Invalid adjustment type in CSV row: " + trimmedLine + ". Valid values: ADD, REMOVE, SET",
                            "INVALID_CSV_DATA");
                }
            }

        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            throw new BusinessException("Failed to parse CSV file: " + e.getMessage(), "CSV_PARSE_ERROR");
        }

        if (requests.isEmpty()) {
            throw new BusinessException("CSV file contains no data rows", "EMPTY_CSV");
        }

        return requests;
    }

    private int calculateNewStock(int currentStock, AdjustmentType type, int quantity) {
        return switch (type) {
            case ADD -> currentStock + quantity;
            case REMOVE -> currentStock - quantity;
            case SET -> quantity;
        };
    }

    private StockAdjustmentResponse toResponse(StockAdjustment adjustment) {
        return StockAdjustmentResponse.builder()
                .id(adjustment.getId())
                .productId(adjustment.getProductId())
                .adjustmentType(adjustment.getAdjustmentType())
                .quantity(adjustment.getQuantity())
                .resultingStock(adjustment.getResultingStock())
                .reason(adjustment.getReason())
                .performedBy(adjustment.getPerformedBy())
                .createdAt(adjustment.getCreatedAt())
                .build();
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Long) {
            return (Long) authentication.getPrincipal();
        }
        throw new BusinessException("Unable to determine current user", "AUTH_ERROR", HttpStatus.UNAUTHORIZED);
    }
}
