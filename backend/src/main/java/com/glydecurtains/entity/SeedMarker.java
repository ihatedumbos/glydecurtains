package com.glydecurtains.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/** Records that a one-time start-up seeder or upgrader has already run on this database. */
@Entity
@Table(name = "seed_markers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SeedMarker {

    @Id
    @Column(name = "name", length = 100)
    private String name;

    @Column(name = "applied_at", nullable = false)
    private LocalDateTime appliedAt;
}
