package com.glydecurtains.repository;

import com.glydecurtains.entity.StoreLocation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StoreLocationRepository extends JpaRepository<StoreLocation, Long> {

    Page<StoreLocation> findAllByOrderByNameAsc(Pageable pageable);

    @Query("SELECT s FROM StoreLocation s WHERE s.isActive = true AND " +
           "(LOWER(s.city) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(s.state) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(s.address) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<StoreLocation> searchByArea(@Param("query") String query);
}
