package com.postman.alt.service.impl;

import com.postman.alt.entity.AppUser;
import com.postman.alt.entity.Project;
import com.postman.alt.entity.ProjectMember;
import com.postman.alt.entity.ProjectMemberId;
import com.postman.alt.exception.ForbiddenException;
import com.postman.alt.exception.ResourceNotFoundException;
import com.postman.alt.repository.AppUserRepository;
import com.postman.alt.repository.ProjectMemberRepository;
import com.postman.alt.repository.ProjectRepository;
import com.postman.alt.repository.ProjectRolePermissionRepository;
import com.postman.alt.service.ProjectAccessService;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class ProjectAccessServiceImpl implements ProjectAccessService {

    private final ProjectMemberRepository projectMemberRepository;
    private final ProjectRolePermissionRepository projectRolePermissionRepository;
    private final AppUserRepository appUserRepository;
    private final ProjectRepository projectRepository;

    public ProjectAccessServiceImpl(
            ProjectMemberRepository projectMemberRepository,
            ProjectRolePermissionRepository projectRolePermissionRepository,
            AppUserRepository appUserRepository,
            ProjectRepository projectRepository
    ) {
        this.projectMemberRepository = projectMemberRepository;
        this.projectRolePermissionRepository = projectRolePermissionRepository;
        this.appUserRepository = appUserRepository;
        this.projectRepository = projectRepository;
    }

    @Override
    public ProjectMember requireMember(UUID projectId, UUID userId) {
        // every project-scoped service (work items, comments, roles, ...)
        // routes access checks through here, so this is the one place a
        // soft-deleted project needs to be excluded to lock the whole
        // project down at once. The deletedAt check is folded into the
        // query (not a separate member.getProject().getDeletedAt() call)
        // so this works whether or not the caller wrapped itself in
        // @Transactional - a lazy Project proxy touched outside a session
        // throws LazyInitializationException, a WHERE clause doesn't.
        // "deleted" and "never a member" are deliberately indistinguishable
        // to the caller - both are just "not a member of this project".
        return projectMemberRepository.findByIdAndProject_DeletedAtIsNull(new ProjectMemberId(projectId, userId))
                .orElseThrow(() -> new ForbiddenException("Not a member of this project"));
    }

    @Override
    public void requirePermission(UUID projectId, UUID userId, String permissionCode) {
        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("AppUser", userId));

        // owner bypasses per-role permission checks, but only within their
        // OWN organization - without this org check, isOwner()=true (true
        // for every self-registered user, on their own brand-new org) would
        // let them bypass permission checks on ANY project in the system,
        // not just their own org's. A different org's owner still needs to
        // be a member of this project like anyone else, checked below.
        if (user.isOwner()) {
            Project project = projectRepository.findByIdAndDeletedAtIsNull(projectId)
                    .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));
            if (project.getOrganization().getId().equals(user.getOrganization().getId())) {
                return;
            }
        }

        ProjectMember member = requireMember(projectId, userId);
        boolean granted = projectRolePermissionRepository
                .existsByRoleIdAndPermissionCode(member.getRole().getId(), permissionCode);
        if (!granted) {
            throw new ForbiddenException("Missing permission: " + permissionCode);
        }
    }
}
