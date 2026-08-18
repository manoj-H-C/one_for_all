package com.postman.alt.service;

import com.postman.alt.service.dto.AttachmentCreateRequest;
import com.postman.alt.service.dto.AttachmentResponse;

import java.util.List;
import java.util.UUID;

public interface AttachmentService {

    List<AttachmentResponse> list(UUID workItemId, UUID requesterId);

    AttachmentResponse create(UUID workItemId, UUID requesterId, AttachmentCreateRequest request);

    void delete(UUID attachmentId, UUID requesterId);
}
