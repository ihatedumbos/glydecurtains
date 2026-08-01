package com.glydecurtains.repository;

import com.glydecurtains.entity.Enquiry;
import com.glydecurtains.entity.enums.EnquiryStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface EnquiryRepository extends JpaRepository<Enquiry, Long> {

    Page<Enquiry> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<Enquiry> findByStatusOrderByCreatedAtDesc(EnquiryStatus status, Pageable pageable);

    @Query("SELECT e FROM Enquiry e WHERE " +
           "(LOWER(e.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(e.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(e.subject) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY e.createdAt DESC")
    Page<Enquiry> searchByNameEmailOrSubject(@Param("search") String search, Pageable pageable);

    @Query("SELECT e FROM Enquiry e WHERE " +
           "(:status IS NULL OR e.status = :status) AND " +
           "(:search IS NULL OR " +
           "LOWER(e.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(e.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(e.subject) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY e.createdAt DESC")
    Page<Enquiry> findByFilters(@Param("status") EnquiryStatus status, @Param("search") String search, Pageable pageable);
}
