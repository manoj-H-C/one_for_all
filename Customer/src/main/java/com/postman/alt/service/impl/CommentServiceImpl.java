package com.postman.alt.service.impl;

import com.postman.alt.entity.AppUser;
import com.postman.alt.entity.Comment;
import com.postman.alt.entity.Notification;
import com.postman.alt.entity.ProjectMember;
import com.postman.alt.entity.ProjectMemberId;
import com.postman.alt.entity.WorkItem;
import com.postman.alt.enums.NotificationType;
import com.postman.alt.exception.BadRequestException;
import com.postman.alt.exception.ForbiddenException;
import com.postman.alt.exception.ResourceNotFoundException;
import com.postman.alt.repository.AppUserRepository;
import com.postman.alt.repository.CommentRepository;
import com.postman.alt.repository.NotificationRepository;
import com.postman.alt.repository.ProjectMemberRepository;
import com.postman.alt.repository.WorkItemRepository;
import com.postman.alt.service.CommentService;
import com.postman.alt.service.NotificationService;
import com.postman.alt.service.ProjectAccessService;
import com.postman.alt.service.dto.CommentCreateRequest;
import com.postman.alt.service.dto.CommentResponse;
import com.postman.alt.service.dto.CommentUpdateRequest;
import com.postman.alt.service.dto.NotificationResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class CommentServiceImpl implements CommentService {

    private final CommentRepository commentRepository;
    private final WorkItemRepository workItemRepository;
    private final AppUserRepository appUserRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationService notificationService;
    private final ProjectAccessService projectAccessService;

    public CommentServiceImpl(
            CommentRepository commentRepository,
            WorkItemRepository workItemRepository,
            AppUserRepository appUserRepository,
            ProjectMemberRepository projectMemberRepository,
            NotificationRepository notificationRepository,
            NotificationService notificationService,
            ProjectAccessService projectAccessService
    ) {
        this.commentRepository = commentRepository;
        this.workItemRepository = workItemRepository;
        this.appUserRepository = appUserRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.notificationRepository = notificationRepository;
        this.notificationService = notificationService;
        this.projectAccessService = projectAccessService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CommentResponse> list(UUID workItemId, UUID requesterId) {
        WorkItem item = getWorkItem(workItemId);
        projectAccessService.requireMemberOrOwner(item.getProject().getId(), requesterId);
        return commentRepository.findByWorkItemIdOrderByCreatedAtAsc(workItemId).stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public CommentResponse create(UUID workItemId, UUID requesterId, CommentCreateRequest request) {
        WorkItem item = getWorkItem(workItemId);
        UUID projectId = item.getProject().getId();
        projectAccessService.requirePermission(projectId, requesterId, "COMMENT_CREATE");
        AppUser author = getUser(requesterId);

        // de-duplicate and drop a self-mention - the author doesn't need to
        // be notified about their own comment.
        List<UUID> mentionedUserIds = (request.mentionedUserIds() == null ? List.<UUID>of() : request.mentionedUserIds())
                .stream()
                .distinct()
                .filter(id -> !id.equals(requesterId))
                .toList();
        List<AppUser> mentionedUsers = mentionedUserIds.stream()
                .map(id -> getProjectMemberUser(projectId, id))
                .toList();

        Comment comment = new Comment(item, author, request.body());
        comment.setTimecodeMs(request.timecodeMs());
        comment.setMentionedUserIds(mentionedUserIds);
        comment = commentRepository.save(comment);

        for (AppUser mentioned : mentionedUsers) {
            Notification saved = notificationRepository.save(new Notification(
                    mentioned, item, author, NotificationType.MENTIONED,
                    author.getName() + " mentioned you in a comment on \"" + item.getTitle() + "\""
            ));
            notificationService.publish(NotificationResponse.from(saved), mentioned.getId());
        }

        return toResponse(comment);
    }

    @Override
    @Transactional
    public CommentResponse update(UUID commentId, UUID requesterId, CommentUpdateRequest request) {
        Comment comment = getComment(commentId);
        requireAuthor(comment, requesterId);
        comment.setBody(request.body());
        return toResponse(comment);
    }

    @Override
    @Transactional
    public void delete(UUID commentId, UUID requesterId) {
        Comment comment = getComment(commentId);
        requireAuthor(comment, requesterId);
        commentRepository.delete(comment);
    }

    private void requireAuthor(Comment comment, UUID requesterId) {
        if (!comment.getAuthor().getId().equals(requesterId)) {
            throw new ForbiddenException("Only the comment's author can modify it");
        }
    }

    private Comment getComment(UUID id) {
        return commentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Comment", id));
    }

    private WorkItem getWorkItem(UUID id) {
        return workItemRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("WorkItem", id));
    }

    private AppUser getUser(UUID id) {
        return appUserRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AppUser", id));
    }

    // a mentioned user must be a member of the project the comment's work
    // item belongs to, same rule WorkItemServiceImpl applies to assignees.
    private AppUser getProjectMemberUser(UUID projectId, UUID userId) {
        return projectMemberRepository.findById(new ProjectMemberId(projectId, userId))
                .map(ProjectMember::getUser)
                .orElseThrow(() -> new BadRequestException("Mentioned user is not a member of this project"));
    }

    private CommentResponse toResponse(Comment comment) {
        return new CommentResponse(
                comment.getId(), comment.getWorkItem().getId(), comment.getAuthor().getId(),
                comment.getAuthor().getName(), comment.getBody(), comment.getTimecodeMs(),
                comment.getMentionedUserIds(), comment.getCreatedAt()
        );
    }
}
