package com.glydecurtains.service;

import com.glydecurtains.dto.request.BulkInvoiceRequest;
import com.glydecurtains.dto.request.InvoiceSettingsUpdateRequest;
import com.glydecurtains.dto.response.BulkInvoiceResponse;
import com.glydecurtains.dto.response.InvoiceResponse;
import com.glydecurtains.dto.response.InvoiceSettingsResponse;

public interface InvoiceService {

    InvoiceResponse generateInvoice(Long orderId);

    InvoiceResponse getInvoice(Long orderId);

    BulkInvoiceResponse bulkGenerateInvoices(BulkInvoiceRequest request);

    InvoiceSettingsResponse getSettings();

    InvoiceSettingsResponse updateSettings(InvoiceSettingsUpdateRequest request);
}
