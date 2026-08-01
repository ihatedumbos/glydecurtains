package com.glydecurtains.repository;

import com.glydecurtains.entity.RecentSearch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RecentSearchRepository extends JpaRepository<RecentSearch, Long> {

    List<RecentSearch> findByUserIdOrderBySearchedAtDesc(Long userId);

    Optional<RecentSearch> findByUserIdAndQuery(Long userId, String query);

    long countByUserId(Long userId);

    void deleteByUserId(Long userId);

    @Modifying
    @Query("DELETE FROM RecentSearch r WHERE r.userId = :userId AND r.id IN " +
           "(SELECT r2.id FROM RecentSearch r2 WHERE r2.userId = :userId ORDER BY r2.searchedAt ASC)")
    void deleteOldestByUserId(@Param("userId") Long userId);
}
