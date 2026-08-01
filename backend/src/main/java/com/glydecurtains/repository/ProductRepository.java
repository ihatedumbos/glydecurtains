package com.glydecurtains.repository;

import com.glydecurtains.entity.Product;
import com.glydecurtains.entity.enums.ProductStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    Optional<Product> findBySku(String sku);

    List<Product> findByStatus(ProductStatus status);

    Page<Product> findByStatus(ProductStatus status, Pageable pageable);

    List<Product> findByCategoryId(Long categoryId);

    Page<Product> findByCategoryId(Long categoryId, Pageable pageable);

    List<Product> findBySubCategoryId(Long subCategoryId);

    List<Product> findByCollectionId(Long collectionId);

    List<Product> findByIsFeaturedTrue();

    List<Product> findByIsTrendingTrue();

    List<Product> findByIsNewArrivalTrue();

    List<Product> findByIsBestSellerTrue();

    List<Product> findByIsPremiumTrue();

    @Query("SELECT p FROM Product p WHERE p.status = :status AND " +
           "(LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.sku) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.brand) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.tags) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Product> search(@Param("query") String query, @Param("status") ProductStatus status, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE " +
           "LOWER(p.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.sku) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.brand) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(p.tags) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<Product> searchAll(@Param("query") String query, Pageable pageable);

    boolean existsBySku(String sku);

    boolean existsBySkuAndIdNot(String sku, Long id);

    List<Product> findByCategoryIdAndStatus(Long categoryId, ProductStatus status);

    Page<Product> findByCategoryIdAndStatus(Long categoryId, ProductStatus status, Pageable pageable);

    List<Product> findByCategoryIdAndStatusAndIdNot(Long categoryId, ProductStatus status, Long id);

    @Query("SELECT p FROM Product p WHERE p.status = :status AND p.id <> :productId AND " +
           "(p.material = :material OR p.brand = :brand OR p.pattern = :pattern)")
    List<Product> findSimilarProducts(@Param("productId") Long productId,
                                      @Param("status") ProductStatus status,
                                      @Param("material") String material,
                                      @Param("brand") String brand,
                                      @Param("pattern") String pattern);

    boolean existsByCategoryId(Long categoryId);
}
