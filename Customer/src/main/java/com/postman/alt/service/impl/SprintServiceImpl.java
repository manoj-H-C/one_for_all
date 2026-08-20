package com.postman.alt.service.impl;

import com.postman.alt.entity.Project;
import com.postman.alt.entity.Sprint;
import com.postman.alt.exception.ResourceNotFoundException;
import com.postman.alt.repository.ProjectRepository;
import com.postman.alt.repository.SprintRepository;
import com.postman.alt.service.ProjectAccessService;
import com.postman.alt.service.SprintService;
import com.postman.alt.service.dto.SprintCreateRequest;
import com.postman.alt.service.dto.SprintResponse;
import com.postman.alt.service.dto.SprintUpdateRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class SprintServiceImpl implements SprintService {

    private static final String WORKFLOW_MANAGE = "WORKFLOW_MANAGE";

    private final SprintRepository sprintRepository;
    private final ProjectRepository projectRepository;
    private final ProjectAccessService projectAccessService;

    public SprintServiceImpl(
            SprintRepository sprintRepository,
            ProjectRepository projectRepository,
            ProjectAccessService projectAccessService
    ) {
        this.sprintRepository = sprintRepository;
        this.projectRepository = projectRepository;
        this.projectAccessService = projectAccessService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<SprintResponse> list(UUID projectId, UUID requesterId) {
        projectAccessService.requireMemberOrOwner(projectId, requesterId);
        return sprintRepository.findByProjectIdOrderByStartDateAscCreatedAtAsc(projectId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public SprintResponse create(UUID projectId, UUID requesterId, SprintCreateRequest request) {
        projectAccessService.requirePermission(projectId, requesterId, WORKFLOW_MANAGE);
        Project project = getProject(projectId);
        Sprint sprint = sprintRepository.save(
                new Sprint(project, request.name(), request.startDate(), request.endDate())
        );
        return toResponse(sprint);
    }

    @Override
    @Transactional
    public SprintResponse update(UUID projectId, UUID sprintId, UUID requesterId, SprintUpdateRequest request) {
        projectAccessService.requirePermission(projectId, requesterId, WORKFLOW_MANAGE);
        Sprint sprint = getSprint(projectId, sprintId);

        if (request.name() != null) {
            sprint.setName(request.name());
        }
        if (request.startDate() != null) {
            sprint.setStartDate(request.startDate());
        }
        if (request.endDate() != null) {
            sprint.setEndDate(request.endDate());
        }

        return toResponse(sprint);
    }

    @Override
    @Transactional
    public void delete(UUID projectId, UUID sprintId, UUID requesterId) {
        projectAccessService.requirePermission(projectId, requesterId, WORKFLOW_MANAGE);
        Sprint sprint = getSprint(projectId, sprintId);
        sprintRepository.delete(sprint);
    }

    private Sprint getSprint(UUID projectId, UUID sprintId) {
        Sprint sprint = sprintRepository.findById(sprintId)
                .orElseThrow(() -> new ResourceNotFoundException("Sprint", sprintId));
        if (!sprint.getProject().getId().equals(projectId)) {
            throw new ResourceNotFoundException("Sprint", sprintId);
        }
        return sprint;
    }

    private Project getProject(UUID id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project", id));
    }

    private SprintResponse toResponse(Sprint sprint) {
        return new SprintResponse(
                sprint.getId(), sprint.getProject().getId(), sprint.getName(),
                sprint.getStartDate(), sprint.getEndDate(), sprint.getCreatedAt()
        );
    }
}
