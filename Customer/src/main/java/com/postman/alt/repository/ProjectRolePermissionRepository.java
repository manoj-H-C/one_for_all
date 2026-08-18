package com.postman.alt.repository;

import com.postman.alt.entity.ProjectRolePermission;
import com.postman.alt.entity.ProjectRolePermissionId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ProjectRolePermissionRepository extends JpaRepository<ProjectRolePermission, ProjectRolePermissionId> {

    List<ProjectRolePermission> findByRoleId(UUID roleId);

    boolean existsByRoleIdAndPermissionCode(UUID roleId, String permissionCode);
}