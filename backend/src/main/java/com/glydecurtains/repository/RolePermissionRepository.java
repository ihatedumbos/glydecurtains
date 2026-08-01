package com.glydecurtains.repository;

import com.glydecurtains.entity.RolePermission;
import com.glydecurtains.entity.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RolePermissionRepository extends JpaRepository<RolePermission, Long> {

    List<RolePermission> findByRole(UserRole role);

    Optional<RolePermission> findByRoleAndPermissionId(UserRole role, Long permissionId);

    Optional<RolePermission> findByRoleAndPermission_EntityAndPermission_Operation(
            UserRole role, String entity, String operation);
}
