package com.postman.alt.service.impl;

import com.postman.alt.entity.AppUser;
import com.postman.alt.entity.WorkItem;
import com.postman.alt.entity.WorkItemLink;
import com.postman.alt.enums.WorkItemLinkType;
import com.postman.alt.exception.BadRequestException;
import com.postman.alt.exception.ForbiddenException;
import com.postman.alt.exception.ResourceNotFoundException;
import com.postman.alt.repository.AppUserRepository;
import com.postman.alt.repository.WorkItemLinkRepository;
import com.postman.alt.repository.WorkItemRepository;
import com.postman.alt.service.ProjectAccessService;
import com.postman.alt.service.WorkItemLinkService;
import com.postman.alt.service.dto.WorkItemLinkCreateRequest;
import com.postman.alt.service.dto.WorkItemLinkResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Stream;

@Service
public class WorkItemLinkServiceImpl implements WorkItemLinkService {

    private static final String WORK_ITEM_EDIT = "WORK_ITEM_EDIT";

    private final WorkItemLinkRepository workItemLinkRepository;
    private final WorkItemRepository workItemRepository;
    private final AppUserRepository appUserRepository;
    private final ProjectAccessService projectAccessService;

    public WorkItemLinkServiceImpl(
            WorkItemLinkRepository workItemLinkRepository,
            WorkItemRepository workItemRepository,
            AppUserRepository appUserRepository,
            ProjectAccessService projectAccessService
    ) {
        this.workItemLinkRepository = workItemLinkRepository;
        this.workItemRepository = workItemRepository;
        this.appUserRepository = appUserRepository;
        this.projectAccessService = projectAccessService;
    }

    @Override
    public List<WorkItemLinkResponse> list(UUID workItemId, UUID requesterId) {
        WorkItem item = getWorkItem(workItemId);
        projectAccessService.requireMember(item.getProject().getId(), requesterId);

        return Stream.concat(
                        workItemLinkRepository.findBySourceWorkItemId(workItemId).stream(),
                        workItemLinkRepository.findByTargetWorkItemId(workItemId).stream()
                )
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public WorkItemLinkResponse create(UUID workItemId, UUID requesterId, WorkItemLinkCreateRequest request) {
        WorkItem source = getWorkItem(workItemId);
        projectAccessService.requirePermission(source.getProject().getId(), requesterId, WORK_ITEM_EDIT);

        if (workItemId.equals(request.targetWorkItemId())) {
            throw new BadRequestException("A work item cannot be linked to itself");
        }
        WorkItem target = getWorkItem(request.targetWorkItemId());
        WorkItemLinkType linkType = parseLinkType(request.linkType());
        AppUser createdBy = getUser(requesterId);

        WorkItemLink link = workItemLinkRepository.save(new WorkItemLink(source, target, linkType, createdBy));
        return toResponse(link);
    }

    @Override
    @Transactional
    public void delete(UUID workItemId, UUID linkId, UUID requesterId) {
        WorkItem item = getWorkItem(workItemId);
        projectAccessService.requirePermission(item.getProject().getId(), requesterId, WORK_ITEM_EDIT);

        WorkItemLink link = workItemLinkRepository.findById(linkId)
                .orElseThrow(() -> new ResourceNotFoundException("WorkItemLink", linkId));
        if (!link.getSourceWorkItem().getId().equals(workItemId) && !link.getTargetWorkItem().getId().equals(workItemId)) {
            throw new ForbiddenException("This link does not belong to the given work item");
        }

        workItemLinkRepository.delete(link);
    }

    private WorkItemLinkType parseLinkType(String raw) {
        try {
            return WorkItemLinkType.valueOf(raw);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Unknown link type: " + raw);
        }
    }

    private WorkItem getWorkItem(UUID id) {
        return workItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("WorkItem", id));
    }

    private AppUser getUser(UUID id) {
        return appUserRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AppUser", id));
    }

    private WorkItemLinkResponse toResponse(WorkItemLink link) {
        return new WorkItemLinkResponse(
                link.getId(), link.getSourceWorkItem().getId(), link.getTargetWorkItem().getId(),
                link.getLinkType().name(), link.getCreatedBy().getId(), link.getCreatedAt()
        );
    }
}
