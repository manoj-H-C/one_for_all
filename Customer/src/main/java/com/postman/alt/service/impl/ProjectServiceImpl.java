package com.postman.alt.service.impl;

import com.postman.alt.entity.AppUser;
import com.postman.alt.entity.Organization;
import com.postman.alt.entity.Permission;
import com.postman.alt.entity.Project;
import com.postman.alt.entity.ProjectMember;
import com.postman.alt.entity.ProjectRole;
import com.postman.alt.entity.ProjectRolePermission;
import com.postman.alt.entity.StatusCategory;
import com.postman.alt.entity.WorkflowStatus;
import com.postman.alt.exception.ConflictException;
import com.postman.alt.exception.ForbiddenException;
import com.postman.alt.exception.ResourceNotFoundException;
import com.postman.alt.repository.AppUserRepository;
import com.postman.alt.repository.PermissionRepository;
import com.postman.alt.repository.ProjectMemberRepository;
import com.postman.alt.repository.ProjectRepository;
import com.postman.alt.repository.ProjectRolePermissionRepository;
import com.postman.alt.repository.ProjectRoleRepository;
import com.postman.alt.repository.StatusCategoryRepository;
import com.postman.alt.repository.WorkflowStatusRepository;
import com.postman.alt.service.ProjectAccessService;
import com.postman.alt.service.ProjectService;
import com.postman.alt.service.dto.ProjectCreateRequest;
import com.postman.alt.service.dto.ProjectResponse;
import com.postman.alt.service.dto.ProjectUpdateRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class ProjectServiceImpl implements ProjectService {

    private static final String PROJECT_MANAGE = "PROJECT_MANAGE";

    private final ProjectRepository projectRepository;
    private final AppUserRepository appUserRepository;
    private final ProjectRoleRepository projectRoleRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final PermissionRepository permissionRepository;
    private final ProjectRolePermissionRepository projectRolePermissionRepository;
    private final StatusCategoryRepository statusCategoryRepository;
    private final WorkflowStatusRepository workflowStatusRepository;
    private final ProjectAccessService projectAccessService;

    public ProjectServiceImpl(
            ProjectRepository projectRepository,
            AppUserRepository appUserRepository,
            ProjectRoleRepository projectRoleRepository,
            ProjectMemberRepository projectMemberRepository,
            PermissionRepository permissionRepository,
            ProjectRolePermissionRepository projectRolePermissionRepository,
            StatusCategoryRepository statusCategoryRepository,
            WorkflowStatusRepository workflowStatusRepository,
            ProjectAccessService projectAccessService
    ) {
        this.projectRepository = projectRepository;
        this.appUserRepository = appUserRepository;
        this.projectRoleRepository = projectRoleRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.permissionRepository = permissionRepository;
        this.projectRolePermissionRepository = projectRolePermissionRepository;
        this.statusCategoryRepository = statusCategoryRepository;
        this.workflowStatusRepository = workflowStatusRepository;
        this.projectAccessService = projectAccessService;
    }

    // Creates the project plus everything it needs to be immediately usable:
    // an Admin role (every permission) with the creator as its first member,
    // and a To Do / In Progress / Done workflow so work items have somewhere
    // to live. This is a stand-in for a real per-templateType seeding system
    // (see the "project templates" gap) - for now every project gets the
    // same generic starter set regardless of templateType.
    @Override
    @Transactional
    public ProjectResponse create(UUID requesterId, ProjectCreateRequest request) {
        AppUser requester = getUser(requesterId);
        if (!requester.isOwner() && !requester.isCanCreateProjects()) {
            throw new ForbiddenException("You don't have permission to create projects in this organization");
        }
        Organization org = requester.getOrganization();

        if (projectRepository.existsByOrganizationIdAndKeyAndDeletedAtIsNull(org.getId(), request.key())) {
            throw new ConflictException("A project with key '" + request.key() + "' already exists in this organization");
        }

        Project project = projectRepository.save(new Project(org, request.name(), request.key(), request.templateType()));

        ProjectRole adminRole = projectRoleRepository.save(new ProjectRole(project, "Admin", "Full access to this project"));
        for (Permission permission : permissionRepository.findAll()) {
            projectRolePermissionRepository.save(new ProjectRolePermission(adminRole, permission));
        }
        projectMemberRepository.save(new ProjectMember(project, requester, adminRole));

        StatusCategory todo = statusCategoryRepository.save(new StatusCategory(project, "To Do", null));
        StatusCategory inProgress = statusCategoryRepository.save(new StatusCategory(project, "In Progress", null));
        StatusCategory done = statusCategoryRepository.save(new StatusCategory(project, "Done", null));
        workflowStatusRepository.save(new WorkflowStatus(project, "To Do", 0, todo));
        workflowStatusRepository.save(new WorkflowStatus(project, "In Progress", 1, inProgress));
        workflowStatusRepository.save(new WorkflowStatus(project, "Done", 2, done));

        return toResponse(project);
    }

    @Override
    public List<ProjectResponse> listForOrg(UUID requesterId) {
        AppUser requester = getUser(requesterId);
        return projectRepository.findByOrganizationIdAndDeletedAtIsNull(requester.getOrganization().getId())
                .stream().map(this::toResponse).toList();
    }

    @Override
    public ProjectResponse get(UUID projectId, UUID requesterId) {
        Project project = getProject(projectId);
        requireSameOrg(project, requesterId);
        return toResponse(project);
    }

    @Override
    @Transactional
    public ProjectResponse update(UUID projectId, UUID requesterId, ProjectUpdateRequest request) {
        Project project = getProject(projectId);
        projectAccessService.requirePermission(projectId, requesterId, PROJECT_MANAGE);

        if (request.name() != null) {
            project.setName(request.name());
        }
        if (request.itemDisplayNameSingular() != null) {
            project.setItemDisplayNameSingular(request.itemDisplayNameSingular());
        }
        if (request.itemDisplayNamePlural() != null) {
            project.setItemDisplayNamePlural(request.itemDisplayNamePlural());
        }
        if (request.sprintLabelSingular() != null) {
            project.setSprintLabelSingular(request.sprintLabelSingular());
        }
        if (request.sprintLabelPlural() != null) {
            project.setSprintLabelPlural(request.sprintLabelPlural());
        }

        return toResponse(project);
    }

    @Override
    @Transactional
    public void delete(UUID projectId, UUID requesterId) {
        Project project = getProject(projectId);
        projectAccessService.requirePermission(projectId, requesterId, PROJECT_MANAGE);
        project.softDelete();
    }

    private void requireSameOrg(Project project, UUID requesterId) {
        AppUser requester = getUser(requesterId);
        if (!project.getOrganization().getId().equals(requester.getOrganization().getId())) {
            throw new ForbiddenException("Project belongs to a different organization");
        }
    }

    private Project getProject(UUID id) {
        return projectRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project", id));
    }

    private AppUser getUser(UUID id) {
        return appUserRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AppUser", id));
    }

    private ProjectResponse toResponse(Project project) {
        return new ProjectResponse(
                project.getId(),
                project.getOrganization().getId(),
                project.getName(),
                project.getKey(),
                project.getTemplateType(),
                project.getItemDisplayNameSingular(),
                project.getItemDisplayNamePlural(),
                project.getSprintLabelSingular(),
                project.getSprintLabelPlural(),
                project.getCreatedAt()
        );
    }
}
