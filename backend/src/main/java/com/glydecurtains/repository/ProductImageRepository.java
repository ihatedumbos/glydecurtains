package com.glydecurtains.repository;

import com.glydecurtains.entity.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductImageRepository extends JpaRepository<ProductImage, Long> {

    List<ProductImage> findByProductIdOrderBySortOrderAsc(Long productId);

    List<ProductImage> findByProductId(Long productId);

    Optional<ProductImage> findByProductIdAndIsThumbnailTrue(Long productId);

    void deleteByProductId(Long productId);
}
