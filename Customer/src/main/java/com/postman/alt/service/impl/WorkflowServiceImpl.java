package com.postman.alt.service.impl;

import com.postman.alt.entity.Project;
import com.postman.alt.entity.StatusCategory;
import com.postman.alt.entity.WorkflowStatus;
import com.postman.alt.exception.ConflictException;
import com.postman.alt.exception.ResourceNotFoundException;
import com.postman.alt.repository.ProjectRepository;
import com.postman.alt.repository.StatusCategoryRepository;
import com.postman.alt.repository.WorkItemRepository;
import com.postman.alt.repository.WorkflowStatusRepository;
import com.postman.alt.service.ProjectAccessService;
import com.postman.alt.service.WorkflowService;
import com.postman.alt.service.dto.StatusCategoryCreateRequest;
import com.postman.alt.service.dto.StatusCategoryResponse;
import com.postman.alt.service.dto.StatusCategoryUpdateRequest;
import com.postman.alt.service.dto.WorkflowStatusCreateRequest;
import com.postman.alt.service.dto.WorkflowStatusResponse;
import com.postman.alt.service.dto.WorkflowStatusUpdateRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class WorkflowServiceImpl implements WorkflowService {

    private static final String WORKFLOW_MANAGE = "WORKFLOW_MANAGE";

    private final StatusCategoryRepository statusCategoryRepository;
    private final WorkflowStatusRepository workflowStatusRepository;
    private final WorkItemRepository workItemRepository;
    private final ProjectRepository projectRepository;
    private final ProjectAccessService projectAccessService;

    public WorkflowServiceImpl(
            StatusCategoryRepository statusCategoryRepository,
            WorkflowStatusRepository workflowStatusRepository,
            WorkItemRepository workItemRepository,
            ProjectRepository projectRepository,
            ProjectAccessService projectAccessService
    ) {
        this.statusCategoryRepository = statusCategoryRepository;
        this.workflowStatusRepository = workflowStatusRepository;
        this.workItemRepository = workItemRepository;
        this.projectRepository = projectRepository;
        this.projectAccessService = projectAccessService;
    }

    @Override
    public List<StatusCategoryResponse> listCategories(UUID projectId, UUID requesterId) {
        projectAccessService.requireMemberOrOwner(projectId, requesterId);
        return statusCategoryRepository.findByProjectId(projectId).stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public StatusCategoryResponse createCategory(UUID projectId, UUID requesterId, StatusCategoryCreateRequest request) {
        projectAccessService.requirePermission(projectId, requesterId, WORKFLOW_MANAGE);
        Project project = getProject(projectId);
        StatusCategory category = statusCategoryRepository.save(new StatusCategory(project, request.name(), request.description()));
        return toResponse(category);
    }

    @Override
    @Transactional
    public StatusCategoryResponse updateCategory(UUID projectId, UUID categoryId, UUID requesterId, StatusCategoryUpdateRequest request) {
        projectAccessService.requirePermission(projectId, requesterId, WORKFLOW_MANAGE);
        StatusCategory category = getCategory(projectId, categoryId);

        if (request.name() != null) {
            category.setName(request.name());
        }
        if (request.description() != null) {
            category.setDescription(request.description());
        }

        return toResponse(category);
    }

    @Override
    @Transactional
    public void deleteCategory(UUID projectId, UUID categoryId, UUID requesterId) {
        projectAccessService.requirePermission(projectId, requesterId, WORKFLOW_MANAGE);
        StatusCategory category = getCategory(projectId, categoryId);

        if (workflowStatusRepository.existsByCategoryId(categoryId)) {
            throw new ConflictException("Category still has workflow statuses mapped to it");
        }

        statusCategoryRepository.delete(category);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WorkflowStatusResponse> listStatuses(UUID projectId, UUID requesterId) {
        projectAccessService.requireMemberOrOwner(projectId, requesterId);
        return workflowStatusRepository.findByProjectIdOrderBySortOrderAsc(projectId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public WorkflowStatusResponse createStatus(UUID projectId, UUID requesterId, WorkflowStatusCreateRequest request) {
        projectAccessService.requirePermission(projectId, requesterId, WORKFLOW_MANAGE);
        Project project = getProject(projectId);
        StatusCategory category = getCategory(projectId, request.categoryId());

        WorkflowStatus status = workflowStatusRepository.save(
                new WorkflowStatus(project, request.name(), request.sortOrder(), category)
        );
        return toResponse(status);
    }

    @Override
    @Transactional
    public WorkflowStatusResponse updateStatus(UUID projectId, UUID statusId, UUID requesterId, WorkflowStatusUpdateRequest request) {
        projectAccessService.requirePermission(projectId, requesterId, WORKFLOW_MANAGE);
        WorkflowStatus status = getStatus(projectId, statusId);

        if (request.name() != null) {
            status.setName(request.name());
        }
        if (request.sortOrder() != null) {
            status.setSortOrder(request.sortOrder());
        }
        if (request.categoryId() != null) {
            status.setCategory(getCategory(projectId, request.categoryId()));
        }

        return toResponse(status);
    }

    @Override
    @Transactional
    public void deleteStatus(UUID projectId, UUID statusId, UUID requesterId) {
        projectAccessService.requirePermission(projectId, requesterId, WORKFLOW_MANAGE);
        WorkflowStatus status = getStatus(projectId, statusId);

        if (!workItemRepository.findByProjectIdAndStatusIdAndDeletedAtIsNull(projectId, statusId).isEmpty()) {
            throw new ConflictException("Status is still in use by work items");
        }

        workflowStatusRepository.delete(status);
    }

    private StatusCategory getCategory(UUID projectId, UUID categoryId) {
        StatusCategory category = statusCategoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("StatusCategory", categoryId));
        if (!category.getProject().getId().equals(projectId)) {
            throw new ResourceNotFoundException("StatusCategory", categoryId);
        }
        return category;
    }

    private WorkflowStatus getStatus(UUID projectId, UUID statusId) {
        WorkflowStatus status = workflowStatusRepository.findById(statusId)
                .orElseThrow(() -> new ResourceNotFoundException("WorkflowStatus", statusId));
        if (!status.getProject().getId().equals(projectId)) {
            throw new ResourceNotFoundException("WorkflowStatus", statusId);
        }
        return status;
    }

    private Project getProject(UUID id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project", id));
    }

    private StatusCategoryResponse toResponse(StatusCategory category) {
        return new StatusCategoryResponse(category.getId(), category.getProject().getId(), category.getName(), category.getDescription());
    }

    private WorkflowStatusResponse toResponse(WorkflowStatus status) {
        return new WorkflowStatusResponse(
                status.getId(), status.getProject().getId(), status.getName(), status.getSortOrder(),
                status.getCategory().getId(), status.getCategory().getName()
        );
    }
}
