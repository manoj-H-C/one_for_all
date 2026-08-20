package com.postman.alt.service;

import com.postman.alt.service.dto.WorkItemLinkCreateRequest;
import com.postman.alt.service.dto.WorkItemLinkResponse;

import java.util.List;
import java.util.UUID;

public interface WorkItemLinkService {

    // both outgoing (this item is the source) and incoming links.
    List<WorkItemLinkResponse> list(UUID workItemId, UUID requesterId);

    WorkItemLinkResponse create(UUID workItemId, UUID requesterId, WorkItemLinkCreateRequest request);

    void delete(UUID workItemId, UUID linkId, UUID requesterId);
}
