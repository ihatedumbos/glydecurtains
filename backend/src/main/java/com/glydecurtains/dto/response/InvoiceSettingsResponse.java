package com.glydecurtains.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class InvoiceSettingsResponse {

    private Long id;
    private String companyName;
    private String companyAddress;
    private String companyPhone;
    private String companyEmail;
    private String taxRegistrationNumber;
    private String footerText;
    private String termsText;
    private String numberFormat;
    private Boolean includeLogoOnInvoice;
    private Boolean enableCustomerDownload;
    private Integer nextSequenceNumber;
}
