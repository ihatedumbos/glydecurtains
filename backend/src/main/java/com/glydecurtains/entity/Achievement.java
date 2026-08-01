package com.glydecurtains.entity;

import com.glydecurtains.entity.enums.MetricFormat;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "achievements")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Achievement extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "title", nullable = false, length = 100)
    private String title;

    @Column(name = "description", length = 500)
    private String description;

    @Lob
    @Column(name = "icon_base64", columnDefinition = "TEXT")
    private String iconBase64;

    @Column(name = "achievement_year")
    private Integer year;

    @Column(name = "metric_value")
    private String metricValue;

    @Enumerated(EnumType.STRING)
    @Column(name = "metric_format", nullable = false)
    private MetricFormat metricFormat = MetricFormat.NUMERIC_SUFFIX;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @Column(name = "is_enabled", nullable = false)
    private Boolean isEnabled = true;
}
