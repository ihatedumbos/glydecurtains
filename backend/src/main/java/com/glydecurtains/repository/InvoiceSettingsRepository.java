package com.glydecurtains.repository;

import com.glydecurtains.entity.InvoiceSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InvoiceSettingsRepository extends JpaRepository<InvoiceSettings, Long> {

    default Optional<InvoiceSettings> findSettings() {
        return findAll().stream().findFirst();
    }
}
