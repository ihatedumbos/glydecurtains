package com.glydecurtains.repository;

import com.glydecurtains.entity.EnquiryResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EnquiryResponseRepository extends JpaRepository<EnquiryResponse, Long> {

    List<EnquiryResponse> findByEnquiryIdOrderByCreatedAtAsc(Long enquiryId);
}
