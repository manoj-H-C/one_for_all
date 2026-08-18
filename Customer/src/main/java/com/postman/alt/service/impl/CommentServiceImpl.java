package com.postman.alt.service.impl;

import com.postman.alt.entity.AppUser;
import com.postman.alt.entity.Comment;
import com.postman.alt.entity.WorkItem;
import com.postman.alt.exception.ForbiddenException;
import com.postman.alt.exception.ResourceNotFoundException;
import com.postman.alt.repository.AppUserRepository;
import com.postman.alt.repository.CommentRepository;
import com.postman.alt.repository.WorkItemRepository;
import com.postman.alt.service.CommentService;
import com.postman.alt.service.ProjectAccessService;
import com.postman.alt.service.dto.CommentCreateRequest;
import com.postman.alt.service.dto.CommentResponse;
import com.postman.alt.service.dto.CommentUpdateRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class CommentServiceImpl implements CommentService {

    private final CommentRepository commentRepository;
    private final WorkItemRepository workItemRepository;
    private final AppUserRepository appUserRepository;
    private final ProjectAccessService projectAccessService;

    public CommentServiceImpl(
            CommentRepository commentRepository,
            WorkItemRepository workItemRepository,
            AppUserRepository appUserRepository,
            ProjectAccessService projectAccessService
    ) {
        this.commentRepository = commentRepository;
        this.workItemRepository = workItemRepository;
        this.appUserRepository = appUserRepository;
        this.projectAccessService = projectAccessService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CommentResponse> list(UUID workItemId, UUID requesterId) {
        WorkItem item = getWorkItem(workItemId);
        projectAccessService.requireMember(item.getProject().getId(), requesterId);
        return commentRepository.findByWorkItemIdOrderByCreatedAtAsc(workItemId).stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public CommentResponse create(UUID workItemId, UUID requesterId, CommentCreateRequest request) {
        WorkItem item = getWorkItem(workItemId);
        projectAccessService.requirePermission(item.getProject().getId(), requesterId, "COMMENT_CREATE");
        AppUser author = getUser(requesterId);

        Comment comment = new Comment(item, author, request.body());
        comment.setTimecodeMs(request.timecodeMs());

        return toResponse(commentRepository.save(comment));
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

    private CommentResponse toResponse(Comment comment) {
        return new CommentResponse(
                comment.getId(), comment.getWorkItem().getId(), comment.getAuthor().getId(),
                comment.getAuthor().getName(), comment.getBody(), comment.getTimecodeMs(), comment.getCreatedAt()
        );
    }
}
