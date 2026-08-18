package com.postman.alt.service;

import com.postman.alt.service.dto.CommentCreateRequest;
import com.postman.alt.service.dto.CommentResponse;
import com.postman.alt.service.dto.CommentUpdateRequest;

import java.util.List;
import java.util.UUID;

public interface CommentService {

    List<CommentResponse> list(UUID workItemId, UUID requesterId);

    CommentResponse create(UUID workItemId, UUID requesterId, CommentCreateRequest request);

    CommentResponse update(UUID commentId, UUID requesterId, CommentUpdateRequest request);

    void delete(UUID commentId, UUID requesterId);
}
