package com.postman.alt.service;

import com.postman.alt.entity.ProjectMember;

import java.util.UUID;

/**
 * Central enforcement point for project_role_permission: every service that
 * mutates project-scoped data should route through requirePermission rather
 * than re-implementing this check.
 */
public interface ProjectAccessService {

    ProjectMember requireMember(UUID projectId, UUID userId);

    // org-level owner bypasses project_role_permission entirely - see the
    // "owner" field comment on AppUser.
    void requirePermission(UUID projectId, UUID userId, String permissionCode);
}
