package com.glydecurtains.repository;

import com.glydecurtains.entity.GeneratedInvoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GeneratedInvoiceRepository extends JpaRepository<GeneratedInvoice, Long> {

    Optional<GeneratedInvoice> findByOrderId(Long orderId);

    boolean existsByOrderId(Long orderId);
}
