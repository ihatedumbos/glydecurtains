package com.glydecurtains.repository;

import com.glydecurtains.entity.HomepageSection;
import com.glydecurtains.entity.enums.SectionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HomepageSectionRepository extends JpaRepository<HomepageSection, Long> {

    List<HomepageSection> findByIsEnabledTrueOrderBySortOrderAsc();

    List<HomepageSection> findAllByOrderBySortOrderAsc();

    Optional<HomepageSection> findBySectionType(SectionType sectionType);
}
