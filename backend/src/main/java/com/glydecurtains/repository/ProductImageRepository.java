package com.glydecurtains.repository;

import com.glydecurtains.entity.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductImageRepository extends JpaRepository<ProductImage, Long> {

    List<ProductImage> findByProductIdOrderBySortOrderAsc(Long productId);

    List<ProductImage> findByProductId(Long productId);

    Optional<ProductImage> findByProductIdAndIsThumbnailTrue(Long productId);

    void deleteByProductId(Long productId);

    /** Images whose stored data is short enough to be a seeded placeholder rather than a real photo. */
    @Query("select pi from ProductImage pi where length(pi.base64Data) <= :maxLength")
    List<ProductImage> findWithDataNoLongerThan(@Param("maxLength") int maxLength);
}
