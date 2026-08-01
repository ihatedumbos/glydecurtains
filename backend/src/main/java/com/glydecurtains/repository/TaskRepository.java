package com.glydecurtains.repository;

import com.glydecurtains.entity.Task;
import com.glydecurtains.entity.enums.TaskStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByAssignedToId(Long assignedToId);

    List<Task> findByAssignedById(Long assignedById);

    List<Task> findByAssignedToIdAndStatus(Long assignedToId, TaskStatus status);

    Page<Task> findByAssignedToId(Long assignedToId, Pageable pageable);
}
