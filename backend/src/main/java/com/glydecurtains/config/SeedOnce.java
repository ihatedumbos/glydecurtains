package com.glydecurtains.config;

import com.glydecurtains.entity.SeedMarker;
import com.glydecurtains.repository.SeedMarkerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * Runs start-up seeders and upgraders once per database. The production database now keeps its data across
 * deploys, so re-running them would bring back photos, pages and products the admin removed or changed.
 * To run a changed seeder again on existing databases, give it a new marker name (e.g. "...-v2").
 */
@Component
@RequiredArgsConstructor
public class SeedOnce {

    private final SeedMarkerRepository seedMarkerRepository;

    public void run(String marker, Runnable seeder) {
        if (seedMarkerRepository.existsById(marker)) {
            return;
        }
        seeder.run();
        seedMarkerRepository.save(new SeedMarker(marker, LocalDateTime.now()));
    }
}
