package com.glydecurtains.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "invoice_settings")
@Getter
@Setter
@NoArgsConstructor
public class InvoiceSettings extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_name", length = 200)
    private String companyName;

    @Column(name = "company_address", length = 500)
    private String companyAddress;

    @Column(name = "company_phone", length = 20)
    private String companyPhone;

    @Column(name = "company_email", length = 100)
    private String companyEmail;

    @Column(name = "tax_registration_number", length = 50)
    private String taxRegistrationNumber;

    @Column(name = "footer_text", length = 500)
    private String footerText;

    @Column(name = "terms_text", length = 2000)
    private String termsText;

    @Column(name = "number_format", length = 50)
    private String numberFormat = "INV-{DATE}-{SEQ}";

    @Column(name = "include_logo_on_invoice")
    private Boolean includeLogoOnInvoice = true;

    @Column(name = "enable_customer_download")
    private Boolean enableCustomerDownload = true;

    @Column(name = "next_sequence_number")
    private Integer nextSequenceNumber = 1;
}
