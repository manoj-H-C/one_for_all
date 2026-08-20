package com.postman.alt.repository;

import com.postman.alt.entity.ProjectRolePermission;
import com.postman.alt.entity.ProjectRolePermissionId;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ProjectRolePermissionRepository extends JpaRepository<ProjectRolePermission, ProjectRolePermissionId> {

    List<ProjectRolePermission> findByRoleId(UUID roleId);

    // fetches every role's permission links for a project in one query -
    // used by RoleServiceImpl.list() to avoid an N+1 (one findByRoleId per
    // role) when listing all of a project's roles.
    List<ProjectRolePermission> findByRole_ProjectId(UUID projectId);

    boolean existsByRoleIdAndPermissionCode(UUID roleId, String permissionCode);
}