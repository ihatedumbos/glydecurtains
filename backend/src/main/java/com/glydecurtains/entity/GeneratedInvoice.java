package com.glydecurtains.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "generated_invoices", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"order_id"}),
        @UniqueConstraint(columnNames = {"invoice_number"})
})
@Getter
@Setter
@NoArgsConstructor
public class GeneratedInvoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false, unique = true)
    private Long orderId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", insertable = false, updatable = false)
    private Order order;

    @Column(name = "invoice_number", nullable = false, unique = true, length = 30)
    private String invoiceNumber;

    @Lob
    @Column(name = "pdf_base64", nullable = false, columnDefinition = "CLOB")
    private String pdfBase64;

    @Column(name = "generated_at", nullable = false)
    private LocalDateTime generatedAt;

    @Column(name = "generated_by", nullable = false)
    private Long generatedBy;
}
