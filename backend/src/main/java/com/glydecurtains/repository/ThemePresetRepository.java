package com.glydecurtains.repository;

import com.glydecurtains.entity.ThemePreset;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ThemePresetRepository extends JpaRepository<ThemePreset, Long> {

    Optional<ThemePreset> findByIsActiveTrue();

    Optional<ThemePreset> findByIsDefaultTrue();
}
