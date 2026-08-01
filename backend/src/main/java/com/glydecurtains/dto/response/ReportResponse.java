package com.glydecurtains.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportResponse {

    private String reportType;
    private String title;
    private LocalDateTime generatedAt;
    private Map<String, Object> summary;
    private List<Map<String, Object>> data;
    private String exportFormat; // placeholder for future export (CSV, PDF)
}
