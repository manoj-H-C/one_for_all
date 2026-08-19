package com.postman.alt.service.impl;

import com.postman.alt.entity.Project;
import com.postman.alt.entity.WorkItemType;
import com.postman.alt.exception.ResourceNotFoundException;
import com.postman.alt.repository.ProjectRepository;
import com.postman.alt.repository.WorkItemTypeRepository;
import com.postman.alt.service.ProjectAccessService;
import com.postman.alt.service.WorkItemTypeService;
import com.postman.alt.service.dto.WorkItemTypeCreateRequest;
import com.postman.alt.service.dto.WorkItemTypeResponse;
import com.postman.alt.service.dto.WorkItemTypeUpdateRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class WorkItemTypeServiceImpl implements WorkItemTypeService {

    private static final String WORKFLOW_MANAGE = "WORKFLOW_MANAGE";

    private final WorkItemTypeRepository workItemTypeRepository;
    private final ProjectRepository projectRepository;
    private final ProjectAccessService projectAccessService;

    public WorkItemTypeServiceImpl(
            WorkItemTypeRepository workItemTypeRepository,
            ProjectRepository projectRepository,
            ProjectAccessService projectAccessService
    ) {
        this.workItemTypeRepository = workItemTypeRepository;
        this.projectRepository = projectRepository;
        this.projectAccessService = projectAccessService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkItemTypeResponse> list(UUID projectId, UUID requesterId) {
        projectAccessService.requireMemberOrOwner(projectId, requesterId);
        return workItemTypeRepository.findByProjectIdOrderByCreatedAtAsc(projectId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public WorkItemTypeResponse create(UUID projectId, UUID requesterId, WorkItemTypeCreateRequest request) {
        projectAccessService.requirePermission(projectId, requesterId, WORKFLOW_MANAGE);
        Project project = getProject(projectId);
        WorkItemType type = workItemTypeRepository.save(new WorkItemType(project, request.name()));
        return toResponse(type);
    }

    @Override
    @Transactional
    public WorkItemTypeResponse update(UUID projectId, UUID typeId, UUID requesterId, WorkItemTypeUpdateRequest request) {
        projectAccessService.requirePermission(projectId, requesterId, WORKFLOW_MANAGE);
        WorkItemType type = getType(projectId, typeId);

        if (request.name() != null) {
            type.setName(request.name());
        }

        return toResponse(type);
    }

    @Override
    @Transactional
    public void delete(UUID projectId, UUID typeId, UUID requesterId) {
        projectAccessService.requirePermission(projectId, requesterId, WORKFLOW_MANAGE);
        WorkItemType type = getType(projectId, typeId);
        workItemTypeRepository.delete(type);
    }

    private WorkItemType getType(UUID projectId, UUID typeId) {
        WorkItemType type = workItemTypeRepository.findById(typeId)
                .orElseThrow(() -> new ResourceNotFoundException("WorkItemType", typeId));
        if (!type.getProject().getId().equals(projectId)) {
            throw new ResourceNotFoundException("WorkItemType", typeId);
        }
        return type;
    }

    private Project getProject(UUID id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project", id));
    }

    private WorkItemTypeResponse toResponse(WorkItemType type) {
        return new WorkItemTypeResponse(type.getId(), type.getProject().getId(), type.getName(), type.getCreatedAt());
    }
}
