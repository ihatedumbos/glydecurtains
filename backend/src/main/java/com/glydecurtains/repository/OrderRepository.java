package com.glydecurtains.repository;

import com.glydecurtains.entity.Order;
import com.glydecurtains.entity.enums.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    Optional<Order> findByOrderNumber(String orderNumber);

    List<Order> findByUserId(Long userId);

    List<Order> findByStatus(OrderStatus status);

    List<Order> findByAssignedEmployeeId(Long assignedEmployeeId);

    List<Order> findByUserIdAndStatus(Long userId, OrderStatus status);

    Page<Order> findByUserId(Long userId, Pageable pageable);

    @Query("SELECT o FROM Order o WHERE " +
            "(:status IS NULL OR o.status = :status) AND " +
            "(:customerId IS NULL OR o.userId = :customerId) AND " +
            "(:dateFrom IS NULL OR o.createdAt >= :dateFrom) AND " +
            "(:dateTo IS NULL OR o.createdAt <= :dateTo) AND " +
            "(:orderNumber IS NULL OR o.orderNumber LIKE %:orderNumber%)")
    Page<Order> findAllWithFilters(
            @Param("status") OrderStatus status,
            @Param("customerId") Long customerId,
            @Param("dateFrom") LocalDateTime dateFrom,
            @Param("dateTo") LocalDateTime dateTo,
            @Param("orderNumber") String orderNumber,
            Pageable pageable);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.createdAt >= :startOfDay AND o.createdAt < :startOfNextDay")
    long countOrdersForDay(@Param("startOfDay") LocalDateTime startOfDay, @Param("startOfNextDay") LocalDateTime startOfNextDay);
}
