package com.glydecurtains.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VariantPriceRequest {

    private String material;

    private String size;

    private String color;

    @NotNull(message = "Variant price is required")
    @DecimalMin(value = "0.00", message = "Variant price cannot be negative (0 means price on request)")
    private BigDecimal price;

    @Min(value = 0, message = "Stock quantity must be zero or greater")
    private Integer stockQuantity;
}
