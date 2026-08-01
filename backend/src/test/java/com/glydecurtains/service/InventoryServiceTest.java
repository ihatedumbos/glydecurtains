package com.glydecurtains.service;

import com.glydecurtains.dto.request.StockAdjustmentRequest;
import com.glydecurtains.dto.request.ThresholdUpdateRequest;
import com.glydecurtains.dto.response.StockAdjustmentResponse;
import com.glydecurtains.entity.Product;
import com.glydecurtains.entity.StockAdjustment;
import com.glydecurtains.entity.enums.AdjustmentType;
import com.glydecurtains.exception.BusinessException;
import com.glydecurtains.repository.ProductRepository;
import com.glydecurtains.repository.StockAdjustmentRepository;
import com.glydecurtains.service.impl.InventoryServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InventoryServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private StockAdjustmentRepository stockAdjustmentRepository;

    @InjectMocks
    private InventoryServiceImpl inventoryService;

    private Product sampleProduct;

    @BeforeEach
    void setUp() {
        sampleProduct = new Product();
        sampleProduct.setId(1L);
        sampleProduct.setStockQuantity(100);
        sampleProduct.setLowStockThreshold(5);
    }

    private void mockSecurityContext() {
        Authentication authentication = mock(Authentication.class);
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getPrincipal()).thenReturn(42L);
        SecurityContextHolder.setContext(securityContext);
    }

    private StockAdjustmentRequest createRequest(Long productId, AdjustmentType type, int quantity, String reason) {
        StockAdjustmentRequest request = new StockAdjustmentRequest();
        request.setProductId(productId);
        request.setAdjustmentType(type);
        request.setQuantity(quantity);
        request.setReason(reason);
        return request;
    }

    private void mockSaveAdjustment() {
        when(stockAdjustmentRepository.save(any(StockAdjustment.class))).thenAnswer(invocation -> {
            StockAdjustment adj = invocation.getArgument(0);
            adj.setId(1L);
            return adj;
        });
    }

    @Nested
    @DisplayName("adjustStock")
    class AdjustStock {

        @Test
        @DisplayName("should add stock successfully")
        void adjustStock_add_success() {
            mockSecurityContext();
            when(productRepository.findById(1L)).thenReturn(Optional.of(sampleProduct));
            when(productRepository.save(any(Product.class))).thenReturn(sampleProduct);
            mockSaveAdjustment();

            StockAdjustmentRequest request = createRequest(1L, AdjustmentType.ADD, 50, "Restocking");

            StockAdjustmentResponse response = inventoryService.adjustStock(request);

            assertThat(response).isNotNull();
            assertThat(response.getResultingStock()).isEqualTo(150);
            assertThat(response.getAdjustmentType()).isEqualTo(AdjustmentType.ADD);
            assertThat(response.getQuantity()).isEqualTo(50);
            verify(productRepository).save(any(Product.class));
            verify(stockAdjustmentRepository).save(any(StockAdjustment.class));
        }

        @Test
        @DisplayName("should remove stock successfully")
        void adjustStock_remove_success() {
            mockSecurityContext();
            when(productRepository.findById(1L)).thenReturn(Optional.of(sampleProduct));
            when(productRepository.save(any(Product.class))).thenReturn(sampleProduct);
            mockSaveAdjustment();

            StockAdjustmentRequest request = createRequest(1L, AdjustmentType.REMOVE, 30, "Sold");

            StockAdjustmentResponse response = inventoryService.adjustStock(request);

            assertThat(response).isNotNull();
            assertThat(response.getResultingStock()).isEqualTo(70);
            assertThat(response.getAdjustmentType()).isEqualTo(AdjustmentType.REMOVE);
        }

        @Test
        @DisplayName("should set stock successfully")
        void adjustStock_set_success() {
            mockSecurityContext();
            when(productRepository.findById(1L)).thenReturn(Optional.of(sampleProduct));
            when(productRepository.save(any(Product.class))).thenReturn(sampleProduct);
            mockSaveAdjustment();

            StockAdjustmentRequest request = createRequest(1L, AdjustmentType.SET, 200, "Inventory count");

            StockAdjustmentResponse response = inventoryService.adjustStock(request);

            assertThat(response).isNotNull();
            assertThat(response.getResultingStock()).isEqualTo(200);
            assertThat(response.getAdjustmentType()).isEqualTo(AdjustmentType.SET);
        }

        @Test
        @DisplayName("should throw BusinessException when remove exceeds stock")
        void adjustStock_remove_exceedsStock_shouldFail() {
            when(productRepository.findById(1L)).thenReturn(Optional.of(sampleProduct));

            StockAdjustmentRequest request = createRequest(1L, AdjustmentType.REMOVE, 150, "Oversell");

            assertThatThrownBy(() -> inventoryService.adjustStock(request))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> {
                        BusinessException bex = (BusinessException) ex;
                        assertThat(bex.getErrorCode()).isEqualTo("INSUFFICIENT_STOCK");
                    });

            verify(productRepository, never()).save(any());
            verify(stockAdjustmentRepository, never()).save(any());
        }

        @Test
        @DisplayName("should throw BusinessException when product not found")
        void adjustStock_productNotFound() {
            when(productRepository.findById(99L)).thenReturn(Optional.empty());

            StockAdjustmentRequest request = createRequest(99L, AdjustmentType.ADD, 10, "Test");

            assertThatThrownBy(() -> inventoryService.adjustStock(request))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> {
                        BusinessException bex = (BusinessException) ex;
                        assertThat(bex.getErrorCode()).isEqualTo("PRODUCT_NOT_FOUND");
                    });
        }
    }

    @Nested
    @DisplayName("bulkAdjustStock")
    class BulkAdjustStock {

        @Test
        @DisplayName("should process all adjustments successfully")
        void bulkAdjustStock_allSuccess() {
            mockSecurityContext();

            Product product1 = new Product();
            product1.setId(1L);
            product1.setStockQuantity(100);

            Product product2 = new Product();
            product2.setId(2L);
            product2.setStockQuantity(50);

            when(productRepository.findById(1L)).thenReturn(Optional.of(product1));
            when(productRepository.findById(2L)).thenReturn(Optional.of(product2));
            when(productRepository.save(any(Product.class))).thenAnswer(i -> i.getArgument(0));
            mockSaveAdjustment();

            List<StockAdjustmentRequest> requests = List.of(
                    createRequest(1L, AdjustmentType.ADD, 20, "Restock A"),
                    createRequest(2L, AdjustmentType.REMOVE, 10, "Sold B")
            );

            List<StockAdjustmentResponse> responses = inventoryService.bulkAdjustStock(requests);

            assertThat(responses).hasSize(2);
            assertThat(responses.get(0).getResultingStock()).isEqualTo(120);
            assertThat(responses.get(1).getResultingStock()).isEqualTo(40);
        }

        @Test
        @DisplayName("should roll back all when any adjustment fails (transactional)")
        void bulkAdjustStock_partialFailure_rollsBack() {
            mockSecurityContext();

            Product product1 = new Product();
            product1.setId(1L);
            product1.setStockQuantity(100);

            Product product2 = new Product();
            product2.setId(2L);
            product2.setStockQuantity(5);

            when(productRepository.findById(1L)).thenReturn(Optional.of(product1));
            when(productRepository.findById(2L)).thenReturn(Optional.of(product2));
            when(productRepository.save(any(Product.class))).thenAnswer(i -> i.getArgument(0));
            mockSaveAdjustment();

            List<StockAdjustmentRequest> requests = List.of(
                    createRequest(1L, AdjustmentType.ADD, 20, "Restock"),
                    createRequest(2L, AdjustmentType.REMOVE, 50, "Oversell")
            );

            assertThatThrownBy(() -> inventoryService.bulkAdjustStock(requests))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> {
                        BusinessException bex = (BusinessException) ex;
                        assertThat(bex.getErrorCode()).isEqualTo("INSUFFICIENT_STOCK");
                    });
        }
    }

    @Nested
    @DisplayName("updateLowStockThreshold")
    class UpdateLowStockThreshold {

        @Test
        @DisplayName("should update threshold successfully")
        void updateLowStockThreshold_success() {
            when(productRepository.findById(1L)).thenReturn(Optional.of(sampleProduct));
            when(productRepository.save(any(Product.class))).thenReturn(sampleProduct);

            ThresholdUpdateRequest request = new ThresholdUpdateRequest(10);

            inventoryService.updateLowStockThreshold(1L, request);

            assertThat(sampleProduct.getLowStockThreshold()).isEqualTo(10);
            verify(productRepository).save(sampleProduct);
        }

        @Test
        @DisplayName("should throw BusinessException when threshold is negative")
        void updateLowStockThreshold_negative_shouldFail() {
            when(productRepository.findById(1L)).thenReturn(Optional.of(sampleProduct));

            ThresholdUpdateRequest request = new ThresholdUpdateRequest(-1);

            assertThatThrownBy(() -> inventoryService.updateLowStockThreshold(1L, request))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> {
                        BusinessException bex = (BusinessException) ex;
                        assertThat(bex.getErrorCode()).isEqualTo("INVALID_THRESHOLD");
                    });

            verify(productRepository, never()).save(any());
        }
    }

    @Nested
    @DisplayName("bulkAdjustFromCsv")
    class BulkAdjustFromCsv {

        @Test
        @DisplayName("should import valid CSV file successfully")
        void bulkAdjustFromCsv_validFile_success() {
            mockSecurityContext();

            Product product1 = new Product();
            product1.setId(1L);
            product1.setStockQuantity(100);

            Product product2 = new Product();
            product2.setId(2L);
            product2.setStockQuantity(50);

            when(productRepository.findById(1L)).thenReturn(Optional.of(product1));
            when(productRepository.findById(2L)).thenReturn(Optional.of(product2));
            when(productRepository.save(any(Product.class))).thenAnswer(i -> i.getArgument(0));
            mockSaveAdjustment();

            String csvContent = "productId,adjustmentType,quantity,reason\n"
                    + "1,ADD,25,Restocking warehouse\n"
                    + "2,REMOVE,10,Customer order\n";

            MockMultipartFile file = new MockMultipartFile(
                    "file", "adjustments.csv", "text/csv",
                    csvContent.getBytes(StandardCharsets.UTF_8));

            List<StockAdjustmentResponse> responses = inventoryService.bulkAdjustFromCsv(file);

            assertThat(responses).hasSize(2);
            assertThat(responses.get(0).getResultingStock()).isEqualTo(125);
            assertThat(responses.get(1).getResultingStock()).isEqualTo(40);
        }

        @Test
        @DisplayName("should throw BusinessException for invalid CSV format (too few columns)")
        void bulkAdjustFromCsv_invalidFormat_shouldFail() {
            String csvContent = "productId,adjustmentType,quantity\n"
                    + "1,ADD,25\n";

            MockMultipartFile file = new MockMultipartFile(
                    "file", "bad.csv", "text/csv",
                    csvContent.getBytes(StandardCharsets.UTF_8));

            assertThatThrownBy(() -> inventoryService.bulkAdjustFromCsv(file))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> {
                        BusinessException bex = (BusinessException) ex;
                        assertThat(bex.getErrorCode()).isEqualTo("INVALID_CSV_FORMAT");
                    });
        }

        @Test
        @DisplayName("should throw BusinessException for invalid adjustment type in CSV")
        void bulkAdjustFromCsv_invalidAdjustmentType_shouldFail() {
            String csvContent = "productId,adjustmentType,quantity,reason\n"
                    + "1,INVALID_TYPE,25,Reason\n";

            MockMultipartFile file = new MockMultipartFile(
                    "file", "bad.csv", "text/csv",
                    csvContent.getBytes(StandardCharsets.UTF_8));

            assertThatThrownBy(() -> inventoryService.bulkAdjustFromCsv(file))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> {
                        BusinessException bex = (BusinessException) ex;
                        assertThat(bex.getErrorCode()).isEqualTo("INVALID_CSV_DATA");
                    });
        }
    }
}
