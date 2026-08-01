package com.glydecurtains.repository;

import com.glydecurtains.entity.Achievement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AchievementRepository extends JpaRepository<Achievement, Long> {

    List<Achievement> findByIsEnabledTrueOrderBySortOrderAsc();

    List<Achievement> findAllByOrderBySortOrderAsc();
}
