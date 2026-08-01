package com.glydecurtains.repository;

import com.glydecurtains.entity.UserPermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserPermissionRepository extends JpaRepository<UserPermission, Long> {

    List<UserPermission> findByUserId(Long userId);

    Optional<UserPermission> findByUserIdAndPermissionId(Long userId, Long permissionId);

    Optional<UserPermission> findByUserIdAndPermission_EntityAndPermission_Operation(
            Long userId, String entity, String operation);
}
