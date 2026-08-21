package com.postman.alt.service.impl;

import com.postman.alt.entity.AppUser;
import com.postman.alt.entity.Reminder;
import com.postman.alt.entity.WorkItem;
import com.postman.alt.enums.ReminderStatus;
import com.postman.alt.exception.BadRequestException;
import com.postman.alt.exception.ForbiddenException;
import com.postman.alt.exception.ResourceNotFoundException;
import com.postman.alt.repository.AppUserRepository;
import com.postman.alt.repository.ReminderRepository;
import com.postman.alt.repository.WorkItemRepository;
import com.postman.alt.service.ProjectAccessService;
import com.postman.alt.service.ReminderService;
import com.postman.alt.service.dto.ReminderCreateRequest;
import com.postman.alt.service.dto.ReminderResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class ReminderServiceImpl implements ReminderService {

    private final ReminderRepository reminderRepository;
    private final WorkItemRepository workItemRepository;
    private final AppUserRepository appUserRepository;
    private final ProjectAccessService projectAccessService;

    public ReminderServiceImpl(
            ReminderRepository reminderRepository,
            WorkItemRepository workItemRepository,
            AppUserRepository appUserRepository,
            ProjectAccessService projectAccessService
    ) {
        this.reminderRepository = reminderRepository;
        this.workItemRepository = workItemRepository;
        this.appUserRepository = appUserRepository;
        this.projectAccessService = projectAccessService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReminderResponse> listForWorkItem(UUID workItemId, UUID requesterId) {
        WorkItem item = getWorkItem(workItemId);
        projectAccessService.requireMemberOrOwner(item.getProject().getId(), requesterId);
        return reminderRepository.findByWorkItem_IdAndRecipient_IdOrderByRemindAtAsc(workItemId, requesterId)
                .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public ReminderResponse create(UUID workItemId, UUID requesterId, ReminderCreateRequest request) {
        WorkItem item = getWorkItem(workItemId);
        projectAccessService.requireMemberOrOwner(item.getProject().getId(), requesterId);

        if (!request.remindAt().isAfter(Instant.now())) {
            throw new BadRequestException("Reminder time must be in the future");
        }

        AppUser recipient = getUser(requesterId);
        String note = request.note() != null && !request.note().isBlank() ? request.note().trim() : null;
        Reminder reminder = reminderRepository.save(new Reminder(item, recipient, request.remindAt(), note));
        return toResponse(reminder);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReminderResponse> listMine(UUID requesterId, String statusFilter) {
        ReminderStatus status = parseStatus(statusFilter);
        List<Reminder> reminders = status != null
                ? reminderRepository.findByRecipient_IdAndStatusOrderByRemindAtAsc(requesterId, status)
                : reminderRepository.findByRecipient_IdOrderByRemindAtAsc(requesterId);
        return reminders.stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public void dismiss(UUID reminderId, UUID requesterId) {
        Reminder reminder = reminderRepository.findById(reminderId)
                .orElseThrow(() -> new ResourceNotFoundException("Reminder", reminderId));
        if (!reminder.getRecipient().getId().equals(requesterId)) {
            throw new ForbiddenException("Only this reminder's recipient can dismiss it");
        }
        reminder.dismiss();
    }

    private ReminderStatus parseStatus(String statusFilter) {
        if (statusFilter == null || statusFilter.isBlank()) {
            return null;
        }
        try {
            return ReminderStatus.valueOf(statusFilter);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Unknown reminder status: " + statusFilter);
        }
    }

    private WorkItem getWorkItem(UUID id) {
        return workItemRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("WorkItem", id));
    }

    private AppUser getUser(UUID id) {
        return appUserRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AppUser", id));
    }

    private ReminderResponse toResponse(Reminder r) {
        return new ReminderResponse(
                r.getId(), r.getWorkItem().getId(), r.getWorkItem().getTitle(),
                r.getWorkItem().getProject().getId(), r.getWorkItem().getProject().getName(),
                r.getRemindAt(), r.getNote(), r.getStatus().name(), r.getCreatedAt()
        );
    }
}
