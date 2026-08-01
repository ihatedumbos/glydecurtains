package com.glydecurtains.repository;

import com.glydecurtains.entity.Feedback;
import com.glydecurtains.entity.enums.FeedbackStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, Long> {

    Optional<Feedback> findByUserIdAndProductId(Long userId, Long productId);

    Page<Feedback> findByProductIdAndStatus(Long productId, FeedbackStatus status, Pageable pageable);

    Page<Feedback> findAllByOrderByCreatedAtDesc(Pageable pageable);

    Page<Feedback> findByStatusOrderByCreatedAtDesc(FeedbackStatus status, Pageable pageable);

    @Query("SELECT AVG(f.rating) FROM Feedback f WHERE f.productId = :productId AND f.status = 'APPROVED'")
    Double findAverageRatingByProductId(@Param("productId") Long productId);

    List<Feedback> findByProductIdAndStatusOrderByCreatedAtDesc(Long productId, FeedbackStatus status);
}
