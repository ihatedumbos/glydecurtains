package com.glydecurtains.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReportFilterRequest {

    private LocalDate startDate;
    private LocalDate endDate;
    private String groupBy; // "day", "week", "month"
}
