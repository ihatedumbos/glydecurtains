package com.glydecurtains.repository;

import com.glydecurtains.entity.SiteSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SiteSettingsRepository extends JpaRepository<SiteSettings, Long> {

    /** The single settings row, whatever id the database gave it. */
    Optional<SiteSettings> findFirstByOrderByIdAsc();
}
