package com.postman.alt.service.impl;

import com.postman.alt.entity.AppUser;
import com.postman.alt.entity.ProjectMember;
import com.postman.alt.entity.ProjectMemberId;
import com.postman.alt.exception.ForbiddenException;
import com.postman.alt.exception.ResourceNotFoundException;
import com.postman.alt.repository.AppUserRepository;
import com.postman.alt.repository.ProjectMemberRepository;
import com.postman.alt.repository.ProjectRolePermissionRepository;
import com.postman.alt.service.ProjectAccessService;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class ProjectAccessServiceImpl implements ProjectAccessService {

    private final ProjectMemberRepository projectMemberRepository;
    private final ProjectRolePermissionRepository projectRolePermissionRepository;
    private final AppUserRepository appUserRepository;

    public ProjectAccessServiceImpl(
            ProjectMemberRepository projectMemberRepository,
            ProjectRolePermissionRepository projectRolePermissionRepository,
            AppUserRepository appUserRepository
    ) {
        this.projectMemberRepository = projectMemberRepository;
        this.projectRolePermissionRepository = projectRolePermissionRepository;
        this.appUserRepository = appUserRepository;
    }

    @Override
    public ProjectMember requireMember(UUID projectId, UUID userId) {
        return projectMemberRepository.findById(new ProjectMemberId(projectId, userId))
                .orElseThrow(() -> new ForbiddenException("Not a member of this project"));
    }

    @Override
    public void requirePermission(UUID projectId, UUID userId, String permissionCode) {
        AppUser user = appUserRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("AppUser", userId));
        if (user.isOwner()) {
            return;
        }

        ProjectMember member = requireMember(projectId, userId);
        boolean granted = projectRolePermissionRepository
                .existsByRoleIdAndPermissionCode(member.getRole().getId(), permissionCode);
        if (!granted) {
            throw new ForbiddenException("Missing permission: " + permissionCode);
        }
    }
}
