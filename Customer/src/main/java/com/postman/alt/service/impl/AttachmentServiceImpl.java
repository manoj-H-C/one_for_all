package com.postman.alt.service.impl;

import com.postman.alt.entity.Attachment;
import com.postman.alt.entity.AppUser;
import com.postman.alt.entity.WorkItem;
import com.postman.alt.exception.ResourceNotFoundException;
import com.postman.alt.repository.AppUserRepository;
import com.postman.alt.repository.AttachmentRepository;
import com.postman.alt.repository.WorkItemRepository;
import com.postman.alt.service.AttachmentService;
import com.postman.alt.service.ProjectAccessService;
import com.postman.alt.service.dto.AttachmentCreateRequest;
import com.postman.alt.service.dto.AttachmentResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class AttachmentServiceImpl implements AttachmentService {

    // no dedicated ATTACHMENT_* permission code exists - reuse WORK_ITEM_EDIT
    // since attaching a file is a kind of editing the work item.
    private static final String WORK_ITEM_EDIT = "WORK_ITEM_EDIT";

    private final AttachmentRepository attachmentRepository;
    private final WorkItemRepository workItemRepository;
    private final AppUserRepository appUserRepository;
    private final ProjectAccessService projectAccessService;

    public AttachmentServiceImpl(
            AttachmentRepository attachmentRepository,
            WorkItemRepository workItemRepository,
            AppUserRepository appUserRepository,
            ProjectAccessService projectAccessService
    ) {
        this.attachmentRepository = attachmentRepository;
        this.workItemRepository = workItemRepository;
        this.appUserRepository = appUserRepository;
        this.projectAccessService = projectAccessService;
    }

    @Override
    public List<AttachmentResponse> list(UUID workItemId, UUID requesterId) {
        WorkItem item = getWorkItem(workItemId);
        projectAccessService.requireMember(item.getProject().getId(), requesterId);
        return attachmentRepository.findByWorkItemIdOrderByCreatedAtAsc(workItemId).stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public AttachmentResponse create(UUID workItemId, UUID requesterId, AttachmentCreateRequest request) {
        WorkItem item = getWorkItem(workItemId);
        projectAccessService.requirePermission(item.getProject().getId(), requesterId, WORK_ITEM_EDIT);
        AppUser uploadedBy = getUser(requesterId);

        Attachment attachment = new Attachment(item, request.fileUrl(), request.fileName(), uploadedBy);
        return toResponse(attachmentRepository.save(attachment));
    }

    @Override
    @Transactional
    public void delete(UUID attachmentId, UUID requesterId) {
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment", attachmentId));

        if (!attachment.getUploadedBy().getId().equals(requesterId)) {
            projectAccessService.requirePermission(attachment.getWorkItem().getProject().getId(), requesterId, WORK_ITEM_EDIT);
        }

        attachmentRepository.delete(attachment);
    }

    private WorkItem getWorkItem(UUID id) {
        return workItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("WorkItem", id));
    }

    private AppUser getUser(UUID id) {
        return appUserRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AppUser", id));
    }

    private AttachmentResponse toResponse(Attachment attachment) {
        return new AttachmentResponse(
                attachment.getId(), attachment.getWorkItem().getId(), attachment.getFileUrl(), attachment.getFileName(),
                attachment.getUploadedBy().getId(), attachment.getUploadedBy().getName(), attachment.getCreatedAt()
        );
    }
}
