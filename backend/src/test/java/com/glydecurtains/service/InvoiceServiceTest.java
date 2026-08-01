package com.glydecurtains.service;

import com.glydecurtains.dto.request.BulkInvoiceRequest;
import com.glydecurtains.dto.response.BulkInvoiceResponse;
import com.glydecurtains.dto.response.InvoiceResponse;
import com.glydecurtains.entity.*;
import com.glydecurtains.entity.enums.OrderStatus;
import com.glydecurtains.exception.BusinessException;
import com.glydecurtains.repository.*;
import com.glydecurtains.service.impl.InvoiceServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InvoiceServiceTest {

    @Mock
    private GeneratedInvoiceRepository generatedInvoiceRepository;

    @Mock
    private InvoiceSettingsRepository invoiceSettingsRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProductVariantRepository productVariantRepository;

    @Mock
    private TemplateEngine templateEngine;

    @InjectMocks
    private InvoiceServiceImpl invoiceService;

    private static final Long USER_ID = 1L;
    private static final Long ORDER_ID = 10L;

    @BeforeEach
    void setUp() {
        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        lenient().when(authentication.getPrincipal()).thenReturn(USER_ID);
        lenient().when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);
    }

    private Order createTestOrder() {
        Order order = new Order();
        order.setId(ORDER_ID);
        order.setOrderNumber("GC-20240101-0001");
        order.setUserId(USER_ID);
        order.setStatus(OrderStatus.PENDING);
        order.setSubtotal(new BigDecimal("500.00"));
        order.setGrandTotal(new BigDecimal("500.00"));
        order.setCreatedAt(LocalDateTime.of(2024, 1, 15, 10, 0));

        OrderItem item = new OrderItem();
        item.setId(1L);
        item.setOrder(order);
        item.setProductId(100L);
        item.setProductName("Velvet Curtain");
        item.setQuantity(2);
        item.setUnitPrice(new BigDecimal("250.00"));
        item.setSubtotal(new BigDecimal("500.00"));
        order.setItems(List.of(item));

        return order;
    }

    private InvoiceSettings createTestSettings() {
        InvoiceSettings settings = new InvoiceSettings();
        settings.setId(1L);
        settings.setCompanyName("Glyde Curtains");
        settings.setCompanyEmail("info@glydecurtains.com");
        settings.setCompanyAddress("123 Main St");
        settings.setCompanyPhone("+1234567890");
        settings.setNumberFormat("INV-{DATE}-{SEQ}");
        settings.setIncludeLogoOnInvoice(true);
        settings.setEnableCustomerDownload(true);
        settings.setNextSequenceNumber(5);
        settings.setFooterText("Thank you for your business!");
        settings.setTermsText("Terms apply.");
        return settings;
    }

    private GeneratedInvoice createTestGeneratedInvoice() {
        GeneratedInvoice invoice = new GeneratedInvoice();
        invoice.setId(1L);
        invoice.setOrderId(ORDER_ID);
        invoice.setInvoiceNumber("INV-20240115-0005");
        invoice.setPdfBase64("dGVzdHBkZg==");
        invoice.setGeneratedAt(LocalDateTime.of(2024, 1, 15, 12, 0));
        invoice.setGeneratedBy(USER_ID);
        return invoice;
    }

    @Nested
    @DisplayName("Generate Invoice")
    class GenerateInvoiceTests {

        @Test
        @DisplayName("Should generate invoice for a valid order")
        void shouldGenerateInvoiceForValidOrder() {
            Order order = createTestOrder();
            InvoiceSettings settings = createTestSettings();
            User customer = new User();
            customer.setId(USER_ID);
            customer.setName("John Doe");
            customer.setEmail("john@example.com");

            when(orderRepository.findById(ORDER_ID)).thenReturn(Optional.of(order));
            when(generatedInvoiceRepository.findByOrderId(ORDER_ID)).thenReturn(Optional.empty());
            when(invoiceSettingsRepository.findSettings()).thenReturn(Optional.of(settings));
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(customer));
            when(templateEngine.process(eq("invoice"), any(Context.class))).thenReturn("<html><body>Invoice</body></html>");
            when(generatedInvoiceRepository.save(any(GeneratedInvoice.class))).thenAnswer(invocation -> {
                GeneratedInvoice saved = invocation.getArgument(0);
                saved.setId(1L);
                return saved;
            });
            when(invoiceSettingsRepository.save(any(InvoiceSettings.class))).thenReturn(settings);

            InvoiceResponse response = invoiceService.generateInvoice(ORDER_ID);

            assertThat(response).isNotNull();
            assertThat(response.getOrderId()).isEqualTo(ORDER_ID);
            assertThat(response.getInvoiceNumber()).startsWith("INV-");
            assertThat(response.getPdfBase64()).isNotBlank();
            assertThat(response.getGeneratedBy()).isEqualTo(USER_ID);

            verify(generatedInvoiceRepository).save(any(GeneratedInvoice.class));
            verify(invoiceSettingsRepository).save(any(InvoiceSettings.class));
        }

        @Test
        @DisplayName("Should return existing invoice if already generated")
        void shouldReturnExistingInvoiceIfAlreadyGenerated() {
            Order order = createTestOrder();
            GeneratedInvoice existingInvoice = createTestGeneratedInvoice();

            when(orderRepository.findById(ORDER_ID)).thenReturn(Optional.of(order));
            when(generatedInvoiceRepository.findByOrderId(ORDER_ID)).thenReturn(Optional.of(existingInvoice));

            InvoiceResponse response = invoiceService.generateInvoice(ORDER_ID);

            assertThat(response).isNotNull();
            assertThat(response.getOrderId()).isEqualTo(ORDER_ID);
            assertThat(response.getInvoiceNumber()).isEqualTo("INV-20240115-0005");

            verify(generatedInvoiceRepository, never()).save(any(GeneratedInvoice.class));
        }

        @Test
        @DisplayName("Should throw BusinessException for non-existent order")
        void shouldThrowExceptionForNonExistentOrder() {
            Long nonExistentOrderId = 999L;
            when(orderRepository.findById(nonExistentOrderId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> invoiceService.generateInvoice(nonExistentOrderId))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Order not found");
        }

        @Test
        @DisplayName("Should increment sequence number after generation")
        void shouldIncrementSequenceNumberAfterGeneration() {
            Order order = createTestOrder();
            InvoiceSettings settings = createTestSettings();
            settings.setNextSequenceNumber(10);

            when(orderRepository.findById(ORDER_ID)).thenReturn(Optional.of(order));
            when(generatedInvoiceRepository.findByOrderId(ORDER_ID)).thenReturn(Optional.empty());
            when(invoiceSettingsRepository.findSettings()).thenReturn(Optional.of(settings));
            when(userRepository.findById(USER_ID)).thenReturn(Optional.empty());
            when(templateEngine.process(eq("invoice"), any(Context.class))).thenReturn("<html></html>");
            when(generatedInvoiceRepository.save(any(GeneratedInvoice.class))).thenAnswer(invocation -> {
                GeneratedInvoice saved = invocation.getArgument(0);
                saved.setId(2L);
                return saved;
            });
            when(invoiceSettingsRepository.save(any(InvoiceSettings.class))).thenReturn(settings);

            invoiceService.generateInvoice(ORDER_ID);

            assertThat(settings.getNextSequenceNumber()).isEqualTo(11);
            verify(invoiceSettingsRepository).save(settings);
        }
    }

    @Nested
    @DisplayName("Get Invoice")
    class GetInvoiceTests {

        @Test
        @DisplayName("Should return cached invoice if exists")
        void shouldReturnCachedInvoiceIfExists() {
            GeneratedInvoice existingInvoice = createTestGeneratedInvoice();

            when(generatedInvoiceRepository.findByOrderId(ORDER_ID)).thenReturn(Optional.of(existingInvoice));

            InvoiceResponse response = invoiceService.getInvoice(ORDER_ID);

            assertThat(response).isNotNull();
            assertThat(response.getOrderId()).isEqualTo(ORDER_ID);
            assertThat(response.getInvoiceNumber()).isEqualTo("INV-20240115-0005");
            assertThat(response.getPdfBase64()).isEqualTo("dGVzdHBkZg==");

            verify(orderRepository, never()).findById(anyLong());
        }

        @Test
        @DisplayName("Should generate on demand if invoice does not exist")
        void shouldGenerateOnDemandIfInvoiceDoesNotExist() {
            Order order = createTestOrder();
            InvoiceSettings settings = createTestSettings();

            when(generatedInvoiceRepository.findByOrderId(ORDER_ID))
                    .thenReturn(Optional.empty())
                    .thenReturn(Optional.empty());
            when(orderRepository.findById(ORDER_ID)).thenReturn(Optional.of(order));
            when(invoiceSettingsRepository.findSettings()).thenReturn(Optional.of(settings));
            when(userRepository.findById(USER_ID)).thenReturn(Optional.empty());
            when(templateEngine.process(eq("invoice"), any(Context.class))).thenReturn("<html></html>");
            when(generatedInvoiceRepository.save(any(GeneratedInvoice.class))).thenAnswer(invocation -> {
                GeneratedInvoice saved = invocation.getArgument(0);
                saved.setId(1L);
                return saved;
            });
            when(invoiceSettingsRepository.save(any(InvoiceSettings.class))).thenReturn(settings);

            InvoiceResponse response = invoiceService.getInvoice(ORDER_ID);

            assertThat(response).isNotNull();
            assertThat(response.getOrderId()).isEqualTo(ORDER_ID);
            verify(generatedInvoiceRepository).save(any(GeneratedInvoice.class));
        }

        @Test
        @DisplayName("Should throw exception when order not found on demand generation")
        void shouldThrowExceptionWhenOrderNotFoundOnDemandGeneration() {
            Long nonExistentOrderId = 999L;
            when(generatedInvoiceRepository.findByOrderId(nonExistentOrderId)).thenReturn(Optional.empty());
            when(orderRepository.findById(nonExistentOrderId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> invoiceService.getInvoice(nonExistentOrderId))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("Order not found");
        }
    }

    @Nested
    @DisplayName("Bulk Generate Invoices")
    class BulkGenerateInvoicesTests {

        @Test
        @DisplayName("Should generate invoices for multiple valid orders")
        void shouldGenerateInvoicesForMultipleValidOrders() {
            Long orderId1 = 10L;
            Long orderId2 = 20L;

            Order order1 = createTestOrder();
            order1.setId(orderId1);

            Order order2 = createTestOrder();
            order2.setId(orderId2);
            order2.setOrderNumber("GC-20240101-0002");

            InvoiceSettings settings = createTestSettings();

            BulkInvoiceRequest request = new BulkInvoiceRequest();
            request.setOrderIds(List.of(orderId1, orderId2));

            when(orderRepository.findById(orderId1)).thenReturn(Optional.of(order1));
            when(orderRepository.findById(orderId2)).thenReturn(Optional.of(order2));
            when(generatedInvoiceRepository.findByOrderId(anyLong())).thenReturn(Optional.empty());
            when(invoiceSettingsRepository.findSettings()).thenReturn(Optional.of(settings));
            when(userRepository.findById(USER_ID)).thenReturn(Optional.empty());
            when(templateEngine.process(eq("invoice"), any(Context.class))).thenReturn("<html></html>");
            when(generatedInvoiceRepository.save(any(GeneratedInvoice.class))).thenAnswer(invocation -> {
                GeneratedInvoice saved = invocation.getArgument(0);
                saved.setId((long) (Math.random() * 1000));
                return saved;
            });
            when(invoiceSettingsRepository.save(any(InvoiceSettings.class))).thenReturn(settings);

            BulkInvoiceResponse response = invoiceService.bulkGenerateInvoices(request);

            assertThat(response.getTotalRequested()).isEqualTo(2);
            assertThat(response.getSuccessCount()).isEqualTo(2);
            assertThat(response.getFailureCount()).isEqualTo(0);
            assertThat(response.getInvoices()).hasSize(2);
            assertThat(response.getErrors()).isEmpty();
        }

        @Test
        @DisplayName("Should report errors for non-existent orders in bulk")
        void shouldReportErrorsForNonExistentOrdersInBulk() {
            Long validOrderId = 10L;
            Long invalidOrderId = 999L;

            Order validOrder = createTestOrder();
            InvoiceSettings settings = createTestSettings();

            BulkInvoiceRequest request = new BulkInvoiceRequest();
            request.setOrderIds(List.of(validOrderId, invalidOrderId));

            when(orderRepository.findById(validOrderId)).thenReturn(Optional.of(validOrder));
            when(orderRepository.findById(invalidOrderId)).thenReturn(Optional.empty());
            when(generatedInvoiceRepository.findByOrderId(validOrderId)).thenReturn(Optional.empty());
            when(invoiceSettingsRepository.findSettings()).thenReturn(Optional.of(settings));
            when(userRepository.findById(USER_ID)).thenReturn(Optional.empty());
            when(templateEngine.process(eq("invoice"), any(Context.class))).thenReturn("<html></html>");
            when(generatedInvoiceRepository.save(any(GeneratedInvoice.class))).thenAnswer(invocation -> {
                GeneratedInvoice saved = invocation.getArgument(0);
                saved.setId(1L);
                return saved;
            });
            when(invoiceSettingsRepository.save(any(InvoiceSettings.class))).thenReturn(settings);

            BulkInvoiceResponse response = invoiceService.bulkGenerateInvoices(request);

            assertThat(response.getTotalRequested()).isEqualTo(2);
            assertThat(response.getSuccessCount()).isEqualTo(1);
            assertThat(response.getFailureCount()).isEqualTo(1);
            assertThat(response.getInvoices()).hasSize(1);
            assertThat(response.getErrors()).hasSize(1);
            assertThat(response.getErrors().get(0)).contains("Order " + invalidOrderId);
        }

        @Test
        @DisplayName("Should handle empty order list")
        void shouldHandleEmptyOrderList() {
            BulkInvoiceRequest request = new BulkInvoiceRequest();
            request.setOrderIds(List.of());

            BulkInvoiceResponse response = invoiceService.bulkGenerateInvoices(request);

            assertThat(response.getTotalRequested()).isEqualTo(0);
            assertThat(response.getSuccessCount()).isEqualTo(0);
            assertThat(response.getFailureCount()).isEqualTo(0);
            assertThat(response.getInvoices()).isEmpty();
            assertThat(response.getErrors()).isEmpty();
        }
    }
}
