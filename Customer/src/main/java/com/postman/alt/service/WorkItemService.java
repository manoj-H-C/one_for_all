package com.postman.alt.service;

import com.postman.alt.service.dto.WorkItemActivityResponse;
import com.postman.alt.service.dto.WorkItemCreateRequest;
import com.postman.alt.service.dto.WorkItemResponse;
import com.postman.alt.service.dto.WorkItemUpdateRequest;

import java.util.List;
import java.util.UUID;

public interface WorkItemService {

    WorkItemResponse create(UUID projectId, UUID reporterId, WorkItemCreateRequest request);

    List<WorkItemResponse> list(UUID projectId, UUID requesterId, UUID statusId, UUID assigneeId);

    WorkItemResponse get(UUID id, UUID requesterId);

    WorkItemResponse update(UUID id, UUID actorId, WorkItemUpdateRequest request);

    WorkItemResponse updateStatus(UUID id, UUID actorId, UUID newStatusId);

    WorkItemResponse updateAssignee(UUID id, UUID actorId, UUID newAssigneeId);

    void delete(UUID id, UUID actorId);

    List<WorkItemActivityResponse> getActivity(UUID id, UUID requesterId);
}
