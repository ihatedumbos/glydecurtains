package com.glydecurtains.dto.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class BulkInvoiceRequest {

    @NotEmpty(message = "Order IDs must not be empty")
    private List<Long> orderIds;
}
