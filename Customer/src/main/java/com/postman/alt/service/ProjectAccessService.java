package com.postman.alt.service;

import com.postman.alt.entity.ProjectMember;

import java.util.UUID;

/**
 * Central enforcement point for project_role_permission: every service that
 * mutates project-scoped data should route through requirePermission rather
 * than re-implementing this check.
 */
public interface ProjectAccessService {

    // strict membership check - true only if a project_member row exists.
    // Used internally by requirePermission (which needs the row's role to
    // check permissions) and anywhere a real ProjectMember is needed. Has NO
    // owner bypass - see requireMemberOrOwner for the version most read-only
    // list()/get() calls should use instead.
    ProjectMember requireMember(UUID projectId, UUID userId);

    // like requireMember, but also passes for the org owner (within their
    // own org) even with no project_member row - matches requirePermission's
    // owner bypass, so an owner never loses read access to a project just
    // because their membership row was removed. Prefer this over
    // requireMember for any check that doesn't need the returned role info.
    void requireMemberOrOwner(UUID projectId, UUID userId);

    // org-level owner bypasses project_role_permission entirely - see the
    // "owner" field comment on AppUser.
    void requirePermission(UUID projectId, UUID userId, String permissionCode);
}
