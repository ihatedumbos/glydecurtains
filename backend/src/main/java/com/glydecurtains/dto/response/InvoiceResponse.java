package com.glydecurtains.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class InvoiceResponse {

    private Long id;
    private Long orderId;
    private String invoiceNumber;
    private String pdfBase64;
    private LocalDateTime generatedAt;
    private Long generatedBy;
}
