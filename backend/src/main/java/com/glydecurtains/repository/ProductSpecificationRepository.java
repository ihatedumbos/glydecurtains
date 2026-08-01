package com.glydecurtains.repository;

import com.glydecurtains.entity.ProductSpecification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductSpecificationRepository extends JpaRepository<ProductSpecification, Long> {

    List<ProductSpecification> findByProductIdOrderBySortOrderAsc(Long productId);

    List<ProductSpecification> findByProductId(Long productId);

    void deleteByProductId(Long productId);
}
