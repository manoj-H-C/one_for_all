package com.postman.alt.service.impl;

import com.postman.alt.entity.Permission;
import com.postman.alt.entity.Project;
import com.postman.alt.entity.ProjectRole;
import com.postman.alt.entity.ProjectRolePermission;
import com.postman.alt.exception.BadRequestException;
import com.postman.alt.exception.ConflictException;
import com.postman.alt.exception.ResourceNotFoundException;
import com.postman.alt.repository.PermissionRepository;
import com.postman.alt.repository.ProjectMemberRepository;
import com.postman.alt.repository.ProjectRepository;
import com.postman.alt.repository.ProjectRolePermissionRepository;
import com.postman.alt.repository.ProjectRoleRepository;
import com.postman.alt.service.ProjectAccessService;
import com.postman.alt.service.RoleService;
import com.postman.alt.service.dto.PermissionResponse;
import com.postman.alt.service.dto.RoleCreateRequest;
import com.postman.alt.service.dto.RoleResponse;
import com.postman.alt.service.dto.RoleUpdateRequest;
import com.postman.alt.service.dto.SetRolePermissionsRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class RoleServiceImpl implements RoleService {

    private static final String ROLE_MANAGE = "ROLE_MANAGE";

    private final ProjectRoleRepository projectRoleRepository;
    private final ProjectRolePermissionRepository projectRolePermissionRepository;
    private final PermissionRepository permissionRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final ProjectRepository projectRepository;
    private final ProjectAccessService projectAccessService;

    public RoleServiceImpl(
            ProjectRoleRepository projectRoleRepository,
            ProjectRolePermissionRepository projectRolePermissionRepository,
            PermissionRepository permissionRepository,
            ProjectMemberRepository projectMemberRepository,
            ProjectRepository projectRepository,
            ProjectAccessService projectAccessService
    ) {
        this.projectRoleRepository = projectRoleRepository;
        this.projectRolePermissionRepository = projectRolePermissionRepository;
        this.permissionRepository = permissionRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.projectRepository = projectRepository;
        this.projectAccessService = projectAccessService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<RoleResponse> list(UUID projectId, UUID requesterId) {
        projectAccessService.requireMember(projectId, requesterId);

        List<ProjectRole> roles = projectRoleRepository.findByProjectId(projectId);
        Map<UUID, Set<String>> permissionCodesByRole = projectRolePermissionRepository.findByRole_ProjectId(projectId).stream()
                .collect(Collectors.groupingBy(
                        rp -> rp.getRole().getId(),
                        Collectors.mapping(rp -> rp.getPermission().getCode(), Collectors.toSet())
                ));

        return roles.stream()
                .map(role -> new RoleResponse(
                        role.getId(), role.getProject().getId(), role.getName(), role.getDescription(),
                        permissionCodesByRole.getOrDefault(role.getId(), Set.of())
                ))
                .toList();
    }

    @Override
    @Transactional
    public RoleResponse create(UUID projectId, UUID requesterId, RoleCreateRequest request) {
        projectAccessService.requirePermission(projectId, requesterId, ROLE_MANAGE);
        Project project = getProject(projectId);
        ProjectRole role = projectRoleRepository.save(new ProjectRole(project, request.name(), request.description()));
        return toResponse(role);
    }

    @Override
    @Transactional
    public RoleResponse update(UUID projectId, UUID roleId, UUID requesterId, RoleUpdateRequest request) {
        projectAccessService.requirePermission(projectId, requesterId, ROLE_MANAGE);
        ProjectRole role = getRole(projectId, roleId);

        if (request.name() != null) {
            role.setName(request.name());
        }
        if (request.description() != null) {
            role.setDescription(request.description());
        }

        return toResponse(role);
    }

    @Override
    @Transactional
    public void delete(UUID projectId, UUID roleId, UUID requesterId) {
        projectAccessService.requirePermission(projectId, requesterId, ROLE_MANAGE);
        ProjectRole role = getRole(projectId, roleId);

        if (projectMemberRepository.existsByRoleId(roleId)) {
            throw new ConflictException("Role is still assigned to project members");
        }

        projectRolePermissionRepository.deleteAll(projectRolePermissionRepository.findByRoleId(roleId));
        projectRoleRepository.delete(role);
    }

    @Override
    @Transactional
    public RoleResponse setPermissions(UUID projectId, UUID roleId, UUID requesterId, SetRolePermissionsRequest request) {
        projectAccessService.requirePermission(projectId, requesterId, ROLE_MANAGE);
        ProjectRole role = getRole(projectId, roleId);

        List<Permission> permissions = request.permissionCodes().stream()
                .map(code -> permissionRepository.findById(code)
                        .orElseThrow(() -> new BadRequestException("Unknown permission code: " + code)))
                .toList();

        projectRolePermissionRepository.deleteAll(projectRolePermissionRepository.findByRoleId(roleId));
        for (Permission permission : permissions) {
            projectRolePermissionRepository.save(new ProjectRolePermission(role, permission));
        }

        return toResponse(role);
    }

    @Override
    public List<PermissionResponse> listPermissionCatalog() {
        return permissionRepository.findAll().stream()
                .map(p -> new PermissionResponse(p.getCode(), p.getDescription()))
                .toList();
    }

    private ProjectRole getRole(UUID projectId, UUID roleId) {
        ProjectRole role = projectRoleRepository.findById(roleId)
                .orElseThrow(() -> new ResourceNotFoundException("ProjectRole", roleId));
        if (!role.getProject().getId().equals(projectId)) {
            throw new ResourceNotFoundException("ProjectRole", roleId);
        }
        return role;
    }

    private Project getProject(UUID id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project", id));
    }

    private RoleResponse toResponse(ProjectRole role) {
        Set<String> permissionCodes = projectRolePermissionRepository.findByRoleId(role.getId()).stream()
                .map(rp -> rp.getPermission().getCode())
                .collect(Collectors.toSet());
        return new RoleResponse(role.getId(), role.getProject().getId(), role.getName(), role.getDescription(), permissionCodes);
    }
}
