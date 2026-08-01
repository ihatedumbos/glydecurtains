package com.glydecurtains.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class InvoiceSettingsUpdateRequest {

    @Size(max = 200)
    private String companyName;

    @Size(max = 500)
    private String companyAddress;

    @Size(max = 20)
    private String companyPhone;

    @Email
    @Size(max = 100)
    private String companyEmail;

    @Size(max = 50)
    private String taxRegistrationNumber;

    @Size(max = 500)
    private String footerText;

    @Size(max = 2000)
    private String termsText;

    @Size(max = 50)
    private String numberFormat;

    private Boolean includeLogoOnInvoice;

    private Boolean enableCustomerDownload;
}
