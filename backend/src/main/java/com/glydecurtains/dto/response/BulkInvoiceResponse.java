package com.glydecurtains.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class BulkInvoiceResponse {

    private int totalRequested;
    private int successCount;
    private int failureCount;
    private List<InvoiceResponse> invoices;
    private List<String> errors;
}
