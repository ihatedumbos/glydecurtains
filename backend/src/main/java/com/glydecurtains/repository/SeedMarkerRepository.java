package com.glydecurtains.repository;

import com.glydecurtains.entity.SeedMarker;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SeedMarkerRepository extends JpaRepository<SeedMarker, String> {
}
