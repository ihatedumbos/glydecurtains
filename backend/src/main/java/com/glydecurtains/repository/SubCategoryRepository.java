package com.glydecurtains.repository;

import com.glydecurtains.entity.SubCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubCategoryRepository extends JpaRepository<SubCategory, Long> {

    List<SubCategory> findByCategoryId(Long categoryId);

    List<SubCategory> findByCategoryIdOrderBySortOrderAsc(Long categoryId);

    List<SubCategory> findByIsActiveTrue();
}
