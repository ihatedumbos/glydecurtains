package com.glydecurtains.repository;

import com.glydecurtains.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    List<Category> findByIsActiveTrue();

    List<Category> findByIsVisibleTrue();

    Optional<Category> findByNameIgnoreCase(String name);

    List<Category> findAllByOrderBySortOrderAsc();
}
