package com.postman.alt.service.impl;

import com.postman.alt.entity.AppUser;
import com.postman.alt.entity.Notification;
import com.postman.alt.entity.Project;
import com.postman.alt.entity.ProjectMember;
import com.postman.alt.entity.ProjectMemberId;
import com.postman.alt.entity.WorkItem;
import com.postman.alt.entity.WorkItemActivity;
import com.postman.alt.entity.WorkflowStatus;
import com.postman.alt.enums.NotificationType;
import com.postman.alt.enums.Priority;
import com.postman.alt.exception.BadRequestException;
import com.postman.alt.exception.ResourceNotFoundException;
import com.postman.alt.repository.AppUserRepository;
import com.postman.alt.repository.CustomFieldDefinitionRepository;
import com.postman.alt.repository.NotificationRepository;
import com.postman.alt.repository.ProjectMemberRepository;
import com.postman.alt.repository.ProjectRepository;
import com.postman.alt.repository.WorkItemActivityRepository;
import com.postman.alt.repository.WorkItemRepository;
import com.postman.alt.repository.WorkItemSpecifications;
import com.postman.alt.repository.WorkflowStatusRepository;
import com.postman.alt.service.ProjectAccessService;
import com.postman.alt.service.WorkItemService;
import com.postman.alt.service.dto.WorkItemActivityResponse;
import com.postman.alt.service.dto.WorkItemCreateRequest;
import com.postman.alt.service.dto.WorkItemResponse;
import com.postman.alt.service.dto.WorkItemUpdateRequest;
import com.postman.alt.service.support.CustomFieldValidator;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
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
    private final CustomFieldDefinitionRepository customFieldDefinitionRepository;
    private final ProjectMemberRepository projectMemberRepository;

    public WorkItemServiceImpl(
            WorkItemRepository workItemRepository,
            ProjectRepository projectRepository,
            AppUserRepository appUserRepository,
            WorkflowStatusRepository workflowStatusRepository,
            WorkItemActivityRepository workItemActivityRepository,
            NotificationRepository notificationRepository,
            ProjectAccessService projectAccessService,
            CustomFieldDefinitionRepository customFieldDefinitionRepository,
            ProjectMemberRepository projectMemberRepository
    ) {
        this.workItemRepository = workItemRepository;
        this.projectRepository = projectRepository;
        this.appUserRepository = appUserRepository;
        this.workflowStatusRepository = workflowStatusRepository;
        this.workItemActivityRepository = workItemActivityRepository;
        this.notificationRepository = notificationRepository;
        this.projectAccessService = projectAccessService;
        this.customFieldDefinitionRepository = customFieldDefinitionRepository;
        this.projectMemberRepository = projectMemberRepository;
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

        Map<String, Object> customFields = mergeCustomFields(Map.of(), request.customFields());
        CustomFieldValidator.validate(customFieldDefinitionRepository.findByProjectId(projectId), customFields);
        item.setCustomFields(customFields);

        if (request.assigneeId() != null) {
            item.setAssignee(getProjectMemberUser(projectId, request.assigneeId()));
        }

        item = workItemRepository.save(item);

        if (item.getAssignee() != null) {
            notifyAssigned(item, reporter);
        }

        return toResponse(item);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WorkItemResponse> list(
            UUID projectId, UUID requesterId, UUID statusId, UUID assigneeId,
            String priority, String q, Pageable pageable
    ) {
        projectAccessService.requireMember(projectId, requesterId);

        Priority priorityFilter = null;
        if (priority != null) {
            try {
                priorityFilter = Priority.valueOf(priority);
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Unknown priority: " + priority);
            }
        }

        return workItemRepository
                .findAll(WorkItemSpecifications.forListing(projectId, statusId, assigneeId, priorityFilter, q), pageable)
                .map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
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
            // merge, not replace: a key mapped to null clears that field,
            // anything else present in the item's customFields today and
            // not mentioned in this request is left untouched.
            Map<String, Object> merged = mergeCustomFields(item.getCustomFields(), request.customFields());
            CustomFieldValidator.validate(
                    customFieldDefinitionRepository.findByProjectId(item.getProject().getId()), merged
            );
            item.setCustomFields(merged);
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

        AppUser newAssignee = newAssigneeId != null
                ? getProjectMemberUser(item.getProject().getId(), newAssigneeId)
                : null;
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
        item.softDelete();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WorkItemActivityResponse> getActivity(UUID id, UUID requesterId, Pageable pageable) {
        WorkItem item = getWorkItem(id);
        projectAccessService.requireMember(item.getProject().getId(), requesterId);
        return workItemActivityRepository.findByWorkItemIdOrderByCreatedAtDesc(id, pageable)
                .map(a -> new WorkItemActivityResponse(
                        a.getId(), a.getActor().getId(), a.getActor().getName(),
                        a.getFieldName(), a.getOldValue(), a.getNewValue(), a.getCreatedAt()
                ));
    }

    // JSON merge-patch semantics: a key mapped to null removes that field,
    // anything else overwrites/adds it, and keys not mentioned in `incoming`
    // are left as they were in `existing`.
    private Map<String, Object> mergeCustomFields(Map<String, Object> existing, Map<String, Object> incoming) {
        Map<String, Object> merged = new HashMap<>(existing);
        if (incoming != null) {
            for (Map.Entry<String, Object> entry : incoming.entrySet()) {
                if (entry.getValue() == null) {
                    merged.remove(entry.getKey());
                } else {
                    merged.put(entry.getKey(), entry.getValue());
                }
            }
        }
        return merged;
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
        return workItemRepository.findByIdAndDeletedAtIsNull(id)
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

    // an assignee must be a member of the project the work item belongs to -
    // otherwise a work item could be assigned to a user with no way to ever
    // see it (and who'd get an ASSIGNED notification for a project they have
    // no relationship to).
    private AppUser getProjectMemberUser(UUID projectId, UUID userId) {
        return projectMemberRepository.findById(new ProjectMemberId(projectId, userId))
                .map(ProjectMember::getUser)
                .orElseThrow(() -> new BadRequestException("Assignee is not a member of this project"));
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
