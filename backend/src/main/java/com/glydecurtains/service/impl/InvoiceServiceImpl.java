package com.glydecurtains.service.impl;

import com.glydecurtains.dto.request.BulkInvoiceRequest;
import com.glydecurtains.dto.request.InvoiceSettingsUpdateRequest;
import com.glydecurtains.dto.response.BulkInvoiceResponse;
import com.glydecurtains.dto.response.InvoiceResponse;
import com.glydecurtains.dto.response.InvoiceSettingsResponse;
import com.glydecurtains.entity.*;
import com.glydecurtains.exception.BusinessException;
import com.glydecurtains.repository.*;
import com.glydecurtains.service.InvoiceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import org.xhtmlrenderer.pdf.ITextRenderer;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class InvoiceServiceImpl implements InvoiceService {

    private final GeneratedInvoiceRepository generatedInvoiceRepository;
    private final InvoiceSettingsRepository invoiceSettingsRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ProductVariantRepository productVariantRepository;
    private final TemplateEngine templateEngine;

    @Override
    @Transactional
    public InvoiceResponse generateInvoice(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new BusinessException("Order not found with id: " + orderId));

        // Check if invoice already exists
        Optional<GeneratedInvoice> existing = generatedInvoiceRepository.findByOrderId(orderId);
        if (existing.isPresent()) {
            return toResponse(existing.get());
        }

        InvoiceSettings settings = getOrCreateSettings();
        String invoiceNumber = generateInvoiceNumber(settings);
        String pdfBase64 = generatePdf(order, settings, invoiceNumber);

        GeneratedInvoice invoice = new GeneratedInvoice();
        invoice.setOrderId(orderId);
        invoice.setInvoiceNumber(invoiceNumber);
        invoice.setPdfBase64(pdfBase64);
        invoice.setGeneratedAt(LocalDateTime.now());
        invoice.setGeneratedBy(getCurrentUserId());

        GeneratedInvoice saved = generatedInvoiceRepository.save(invoice);

        // Increment sequence number
        settings.setNextSequenceNumber(settings.getNextSequenceNumber() + 1);
        invoiceSettingsRepository.save(settings);

        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public InvoiceResponse getInvoice(Long orderId) {
        Optional<GeneratedInvoice> existing = generatedInvoiceRepository.findByOrderId(orderId);
        if (existing.isPresent()) {
            return toResponse(existing.get());
        }
        // Generate on demand
        return generateInvoice(orderId);
    }

    @Override
    @Transactional
    public BulkInvoiceResponse bulkGenerateInvoices(BulkInvoiceRequest request) {
        List<InvoiceResponse> invoices = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        for (Long orderId : request.getOrderIds()) {
            try {
                InvoiceResponse response = generateInvoice(orderId);
                invoices.add(response);
            } catch (Exception e) {
                errors.add("Order " + orderId + ": " + e.getMessage());
            }
        }

        return BulkInvoiceResponse.builder()
                .totalRequested(request.getOrderIds().size())
                .successCount(invoices.size())
                .failureCount(errors.size())
                .invoices(invoices)
                .errors(errors)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public InvoiceSettingsResponse getSettings() {
        InvoiceSettings settings = getOrCreateSettings();
        return toSettingsResponse(settings);
    }

    @Override
    @Transactional
    public InvoiceSettingsResponse updateSettings(InvoiceSettingsUpdateRequest request) {
        InvoiceSettings settings = getOrCreateSettings();

        if (request.getCompanyName() != null) {
            settings.setCompanyName(request.getCompanyName());
        }
        if (request.getCompanyAddress() != null) {
            settings.setCompanyAddress(request.getCompanyAddress());
        }
        if (request.getCompanyPhone() != null) {
            settings.setCompanyPhone(request.getCompanyPhone());
        }
        if (request.getCompanyEmail() != null) {
            settings.setCompanyEmail(request.getCompanyEmail());
        }
        if (request.getTaxRegistrationNumber() != null) {
            settings.setTaxRegistrationNumber(request.getTaxRegistrationNumber());
        }
        if (request.getFooterText() != null) {
            settings.setFooterText(request.getFooterText());
        }
        if (request.getTermsText() != null) {
            settings.setTermsText(request.getTermsText());
        }
        if (request.getNumberFormat() != null) {
            settings.setNumberFormat(request.getNumberFormat());
        }
        if (request.getIncludeLogoOnInvoice() != null) {
            settings.setIncludeLogoOnInvoice(request.getIncludeLogoOnInvoice());
        }
        if (request.getEnableCustomerDownload() != null) {
            settings.setEnableCustomerDownload(request.getEnableCustomerDownload());
        }

        InvoiceSettings saved = invoiceSettingsRepository.save(settings);
        return toSettingsResponse(saved);
    }

    // --- Private helper methods ---

    private String generatePdf(Order order, InvoiceSettings settings, String invoiceNumber) {
        try {
            // Prepare template context
            Context context = new Context();
            context.setVariable("companyName", settings.getCompanyName() != null ? settings.getCompanyName() : "Glyde Curtains");
            context.setVariable("companyAddress", settings.getCompanyAddress() != null ? settings.getCompanyAddress() : "");
            context.setVariable("companyPhone", settings.getCompanyPhone() != null ? settings.getCompanyPhone() : "");
            context.setVariable("companyEmail", settings.getCompanyEmail() != null ? settings.getCompanyEmail() : "");
            context.setVariable("taxRegistrationNumber", settings.getTaxRegistrationNumber() != null ? settings.getTaxRegistrationNumber() : "");
            context.setVariable("invoiceNumber", invoiceNumber);
            context.setVariable("invoiceDate", LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));

            // Customer info
            User customer = userRepository.findById(order.getUserId()).orElse(null);
            context.setVariable("customerName", customer != null ? customer.getName() : "N/A");
            context.setVariable("customerEmail", customer != null ? customer.getEmail() : "N/A");

            // Order info
            context.setVariable("orderNumber", order.getOrderNumber());
            context.setVariable("orderDate", order.getCreatedAt().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
            context.setVariable("orderStatus", order.getStatus().name());

            // Line items
            List<Map<String, Object>> items = new ArrayList<>();
            for (OrderItem orderItem : order.getItems()) {
                Map<String, Object> item = new HashMap<>();
                item.put("productName", orderItem.getProductName());
                item.put("quantity", orderItem.getQuantity());
                item.put("unitPrice", formatCurrency(orderItem.getUnitPrice()));
                item.put("subtotal", formatCurrency(orderItem.getSubtotal()));

                // Variant info
                String variantInfo = null;
                if (orderItem.getVariantId() != null) {
                    variantInfo = productVariantRepository.findById(orderItem.getVariantId())
                            .map(this::buildVariantDescription)
                            .orElse(null);
                }
                item.put("variantInfo", variantInfo);
                items.add(item);
            }
            context.setVariable("items", items);

            // Totals
            context.setVariable("subtotal", formatCurrency(order.getSubtotal()));
            context.setVariable("grandTotal", formatCurrency(order.getGrandTotal()));

            // Terms and footer
            context.setVariable("termsText", settings.getTermsText() != null ? settings.getTermsText() : "");
            context.setVariable("footerText", settings.getFooterText() != null ? settings.getFooterText() : "Thank you for your business!");

            // Render HTML
            String html = templateEngine.process("invoice", context);

            // Convert HTML to PDF using Flying Saucer
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            ITextRenderer renderer = new ITextRenderer();
            renderer.setDocumentFromString(html);
            renderer.layout();
            renderer.createPDF(outputStream);
            outputStream.close();

            // Encode as Base64
            return Base64.getEncoder().encodeToString(outputStream.toByteArray());

        } catch (Exception e) {
            log.error("Failed to generate PDF for order {}: {}", order.getId(), e.getMessage(), e);
            throw new BusinessException("Failed to generate invoice PDF: " + e.getMessage());
        }
    }

    private String buildVariantDescription(ProductVariant variant) {
        List<String> parts = new ArrayList<>();
        if (variant.getMaterial() != null && !variant.getMaterial().isEmpty()) {
            parts.add("Material: " + variant.getMaterial());
        }
        if (variant.getSize() != null && !variant.getSize().isEmpty()) {
            parts.add("Size: " + variant.getSize());
        }
        if (variant.getColor() != null && !variant.getColor().isEmpty()) {
            parts.add("Color: " + variant.getColor());
        }
        return parts.isEmpty() ? null : String.join(" | ", parts);
    }

    private String generateInvoiceNumber(InvoiceSettings settings) {
        String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String sequencePart = String.format("%04d", settings.getNextSequenceNumber());
        return "INV-" + datePart + "-" + sequencePart;
    }

    private String formatCurrency(BigDecimal amount) {
        if (amount == null) return "0.00";
        return String.format("%.2f", amount);
    }

    private InvoiceSettings getOrCreateSettings() {
        return invoiceSettingsRepository.findSettings()
                .orElseGet(() -> {
                    InvoiceSettings newSettings = new InvoiceSettings();
                    newSettings.setCompanyName("Glyde Curtains");
                    newSettings.setCompanyEmail("info@glydecurtains.com");
                    newSettings.setNumberFormat("INV-{DATE}-{SEQ}");
                    newSettings.setIncludeLogoOnInvoice(true);
                    newSettings.setEnableCustomerDownload(true);
                    newSettings.setNextSequenceNumber(1);
                    return invoiceSettingsRepository.save(newSettings);
                });
    }

    private InvoiceResponse toResponse(GeneratedInvoice invoice) {
        return InvoiceResponse.builder()
                .id(invoice.getId())
                .orderId(invoice.getOrderId())
                .invoiceNumber(invoice.getInvoiceNumber())
                .pdfBase64(invoice.getPdfBase64())
                .generatedAt(invoice.getGeneratedAt())
                .generatedBy(invoice.getGeneratedBy())
                .build();
    }

    private InvoiceSettingsResponse toSettingsResponse(InvoiceSettings settings) {
        return InvoiceSettingsResponse.builder()
                .id(settings.getId())
                .companyName(settings.getCompanyName())
                .companyAddress(settings.getCompanyAddress())
                .companyPhone(settings.getCompanyPhone())
                .companyEmail(settings.getCompanyEmail())
                .taxRegistrationNumber(settings.getTaxRegistrationNumber())
                .footerText(settings.getFooterText())
                .termsText(settings.getTermsText())
                .numberFormat(settings.getNumberFormat())
                .includeLogoOnInvoice(settings.getIncludeLogoOnInvoice())
                .enableCustomerDownload(settings.getEnableCustomerDownload())
                .nextSequenceNumber(settings.getNextSequenceNumber())
                .build();
    }

    private Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof Long) {
            return (Long) authentication.getPrincipal();
        }
        throw new BusinessException("User not authenticated");
    }
}
