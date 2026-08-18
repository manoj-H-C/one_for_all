package com.postman.alt.service.impl;

import com.postman.alt.entity.AppUser;
import com.postman.alt.entity.Notification;
import com.postman.alt.entity.Project;
import com.postman.alt.entity.WorkItem;
import com.postman.alt.entity.WorkItemActivity;
import com.postman.alt.entity.WorkflowStatus;
import com.postman.alt.enums.NotificationType;
import com.postman.alt.enums.Priority;
import com.postman.alt.exception.BadRequestException;
import com.postman.alt.exception.ResourceNotFoundException;
import com.postman.alt.repository.AppUserRepository;
import com.postman.alt.repository.NotificationRepository;
import com.postman.alt.repository.ProjectRepository;
import com.postman.alt.repository.WorkItemActivityRepository;
import com.postman.alt.repository.WorkItemRepository;
import com.postman.alt.repository.WorkflowStatusRepository;
import com.postman.alt.service.ProjectAccessService;
import com.postman.alt.service.WorkItemService;
import com.postman.alt.service.dto.WorkItemActivityResponse;
import com.postman.alt.service.dto.WorkItemCreateRequest;
import com.postman.alt.service.dto.WorkItemResponse;
import com.postman.alt.service.dto.WorkItemUpdateRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
public class WorkItemServiceImpl implements WorkItemService {

    private final WorkItemRepository workItemRepository;
    private final ProjectRepository projectRepository;
    private final AppUserRepository appUserRepository;
    private final WorkflowStatusRepository workflowStatusRepository;
    private final WorkItemActivityRepository workItemActivityRepository;
    private final NotificationRepository notificationRepository;
    private final ProjectAccessService projectAccessService;

    public WorkItemServiceImpl(
            WorkItemRepository workItemRepository,
            ProjectRepository projectRepository,
            AppUserRepository appUserRepository,
            WorkflowStatusRepository workflowStatusRepository,
            WorkItemActivityRepository workItemActivityRepository,
            NotificationRepository notificationRepository,
            ProjectAccessService projectAccessService
    ) {
        this.workItemRepository = workItemRepository;
        this.projectRepository = projectRepository;
        this.appUserRepository = appUserRepository;
        this.workflowStatusRepository = workflowStatusRepository;
        this.workItemActivityRepository = workItemActivityRepository;
        this.notificationRepository = notificationRepository;
        this.projectAccessService = projectAccessService;
    }

    @Override
    @Transactional
    public WorkItemResponse create(UUID projectId, UUID reporterId, WorkItemCreateRequest request) {
        projectAccessService.requirePermission(projectId, reporterId, "WORK_ITEM_CREATE");

        Project project = getProject(projectId);
        AppUser reporter = getUser(reporterId);
        WorkflowStatus status = resolveStatus(projectId, request.statusId());

        WorkItem item = new WorkItem(project, status, reporter, request.title());
        item.setDescription(request.description());
        if (request.priority() != null) {
            item.setPriority(Priority.valueOf(request.priority()));
        }
        item.setDueDate(request.dueDate());
        if (request.customFields() != null) {
            item.setCustomFields(request.customFields());
        }
        if (request.assigneeId() != null) {
            item.setAssignee(getUser(request.assigneeId()));
        }

        item = workItemRepository.save(item);

        if (item.getAssignee() != null) {
            notifyAssigned(item, reporter);
        }

        return toResponse(item);
    }

    @Override
    public List<WorkItemResponse> list(UUID projectId, UUID requesterId, UUID statusId, UUID assigneeId) {
        projectAccessService.requireMember(projectId, requesterId);

        List<WorkItem> items = statusId != null
                ? workItemRepository.findByProjectIdAndStatusId(projectId, statusId)
                : workItemRepository.findByProjectId(projectId);

        if (assigneeId != null) {
            items = items.stream()
                    .filter(i -> i.getAssignee() != null && i.getAssignee().getId().equals(assigneeId))
                    .toList();
        }

        return items.stream().map(this::toResponse).toList();
    }

    @Override
    public WorkItemResponse get(UUID id, UUID requesterId) {
        WorkItem item = getWorkItem(id);
        projectAccessService.requireMember(item.getProject().getId(), requesterId);
        return toResponse(item);
    }

    @Override
    @Transactional
    public WorkItemResponse update(UUID id, UUID actorId, WorkItemUpdateRequest request) {
        WorkItem item = getWorkItem(id);
        projectAccessService.requirePermission(item.getProject().getId(), actorId, "WORK_ITEM_EDIT");
        AppUser actor = getUser(actorId);

        if (request.title() != null && !request.title().equals(item.getTitle())) {
            logChange(item, actor, "title", item.getTitle(), request.title());
            item.setTitle(request.title());
        }
        if (request.description() != null && !request.description().equals(item.getDescription())) {
            logChange(item, actor, "description", item.getDescription(), request.description());
            item.setDescription(request.description());
        }
        if (request.priority() != null) {
            Priority newPriority = Priority.valueOf(request.priority());
            if (newPriority != item.getPriority()) {
                logChange(item, actor, "priority", item.getPriority().name(), newPriority.name());
                item.setPriority(newPriority);
            }
        }
        if (request.dueDate() != null && !request.dueDate().equals(item.getDueDate())) {
            logChange(item, actor, "dueDate", String.valueOf(item.getDueDate()), String.valueOf(request.dueDate()));
            item.setDueDate(request.dueDate());
        }
        if (request.customFields() != null) {
            item.setCustomFields(request.customFields());
        }

        return toResponse(item);
    }

    @Override
    @Transactional
    public WorkItemResponse updateStatus(UUID id, UUID actorId, UUID newStatusId) {
        WorkItem item = getWorkItem(id);
        UUID projectId = item.getProject().getId();
        projectAccessService.requirePermission(projectId, actorId, "WORK_ITEM_EDIT");
        AppUser actor = getUser(actorId);

        WorkflowStatus newStatus = resolveStatus(projectId, newStatusId);
        if (!newStatus.getId().equals(item.getStatus().getId())) {
            logChange(item, actor, "status", item.getStatus().getName(), newStatus.getName());
            item.setStatus(newStatus);

            if (item.getAssignee() != null && !item.getAssignee().getId().equals(actorId)) {
                notificationRepository.save(new Notification(
                        item.getAssignee(), item, actor, NotificationType.STATUS_CHANGED,
                        "\"" + item.getTitle() + "\" moved to " + newStatus.getName()
                ));
            }
        }

        return toResponse(item);
    }

    @Override
    @Transactional
    public WorkItemResponse updateAssignee(UUID id, UUID actorId, UUID newAssigneeId) {
        WorkItem item = getWorkItem(id);
        projectAccessService.requirePermission(item.getProject().getId(), actorId, "WORK_ITEM_ASSIGN");
        AppUser actor = getUser(actorId);

        UUID oldAssigneeId = item.getAssignee() != null ? item.getAssignee().getId() : null;
        if (Objects.equals(oldAssigneeId, newAssigneeId)) {
            return toResponse(item);
        }

        AppUser newAssignee = newAssigneeId != null ? getUser(newAssigneeId) : null;
        logChange(
                item, actor, "assignee",
                item.getAssignee() != null ? item.getAssignee().getEmail() : null,
                newAssignee != null ? newAssignee.getEmail() : null
        );
        item.setAssignee(newAssignee);

        if (newAssignee != null) {
            notifyAssigned(item, actor);
        }

        return toResponse(item);
    }

    @Override
    @Transactional
    public void delete(UUID id, UUID actorId) {
        WorkItem item = getWorkItem(id);
        projectAccessService.requirePermission(item.getProject().getId(), actorId, "WORK_ITEM_DELETE");
        workItemRepository.delete(item);
    }

    @Override
    public List<WorkItemActivityResponse> getActivity(UUID id, UUID requesterId) {
        WorkItem item = getWorkItem(id);
        projectAccessService.requireMember(item.getProject().getId(), requesterId);
        return workItemActivityRepository.findByWorkItemIdOrderByCreatedAtDesc(id).stream()
                .map(a -> new WorkItemActivityResponse(
                        a.getId(), a.getActor().getId(), a.getActor().getName(),
                        a.getFieldName(), a.getOldValue(), a.getNewValue(), a.getCreatedAt()
                ))
                .toList();
    }

    private WorkflowStatus resolveStatus(UUID projectId, UUID statusId) {
        if (statusId != null) {
            return workflowStatusRepository.findById(statusId)
                    .filter(s -> s.getProject().getId().equals(projectId))
                    .orElseThrow(() -> new ResourceNotFoundException("WorkflowStatus", statusId));
        }
        return workflowStatusRepository.findByProjectIdOrderBySortOrderAsc(projectId).stream()
                .findFirst()
                .orElseThrow(() -> new BadRequestException("Project has no workflow statuses configured"));
    }

    private void notifyAssigned(WorkItem item, AppUser actor) {
        notificationRepository.save(new Notification(
                item.getAssignee(), item, actor, NotificationType.ASSIGNED,
                "You were assigned to \"" + item.getTitle() + "\""
        ));
    }

    private void logChange(WorkItem item, AppUser actor, String fieldName, String oldValue, String newValue) {
        workItemActivityRepository.save(new WorkItemActivity(item, actor, fieldName, oldValue, newValue));
    }

    private WorkItem getWorkItem(UUID id) {
        return workItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("WorkItem", id));
    }

    private Project getProject(UUID id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project", id));
    }

    private AppUser getUser(UUID id) {
        return appUserRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AppUser", id));
    }

    private WorkItemResponse toResponse(WorkItem item) {
        return new WorkItemResponse(
                item.getId(),
                item.getProject().getId(),
                item.getStatus().getId(),
                item.getStatus().getName(),
                item.getAssignee() != null ? item.getAssignee().getId() : null,
                item.getReporter().getId(),
                item.getTitle(),
                item.getDescription(),
                item.getPriority().name(),
                item.getDueDate(),
                item.getCustomFields(),
                item.getCreatedAt(),
                item.getUpdatedAt()
        );
    }
}
