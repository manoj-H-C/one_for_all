package com.postman.alt.service;

import com.postman.alt.service.dto.WorkItemTypeCreateRequest;
import com.postman.alt.service.dto.WorkItemTypeResponse;
import com.postman.alt.service.dto.WorkItemTypeUpdateRequest;

import java.util.List;
import java.util.UUID;

public interface WorkItemTypeService {

    List<WorkItemTypeResponse> list(UUID projectId, UUID requesterId);

    WorkItemTypeResponse create(UUID projectId, UUID requesterId, WorkItemTypeCreateRequest request);

    WorkItemTypeResponse update(UUID projectId, UUID typeId, UUID requesterId, WorkItemTypeUpdateRequest request);

    // work items using this type fall back to "no type" (type_id set null via
    // the FK's ON DELETE SET NULL) - no "still in use" guard, matching Sprint
    // deletion rather than WorkflowStatus deletion.
    void delete(UUID projectId, UUID typeId, UUID requesterId);
}
