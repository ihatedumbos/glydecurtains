package com.glydecurtains.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "product_specifications")
@Getter
@Setter
@NoArgsConstructor
public class ProductSpecification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @NotBlank
    @Column(name = "spec_key", nullable = false)
    private String specKey;

    @NotBlank
    @Column(name = "spec_value", nullable = false)
    private String specValue;

    @Column(name = "sort_order")
    private Integer sortOrder = 0;

    /** Hidden rows stay in the admin panel only; null (rows saved before this flag) counts as shown. */
    @Column(name = "show_to_customers", columnDefinition = "BOOLEAN DEFAULT TRUE")
    private Boolean showToCustomers = true;

    public boolean isShownToCustomers() {
        return !Boolean.FALSE.equals(showToCustomers);
    }
}
