package com.glydecurtains.repository;

import com.glydecurtains.entity.Banner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BannerRepository extends JpaRepository<Banner, Long> {

    List<Banner> findBySectionIdAndIsActiveTrueOrderBySortOrderAsc(Long sectionId);

    List<Banner> findBySectionIdOrderBySortOrderAsc(Long sectionId);
}
