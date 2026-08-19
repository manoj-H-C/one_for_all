package com.postman.alt.service;

import com.postman.alt.service.dto.WorkItemActivityResponse;
import com.postman.alt.service.dto.WorkItemCreateRequest;
import com.postman.alt.service.dto.WorkItemResponse;
import com.postman.alt.service.dto.WorkItemUpdateRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface WorkItemService {

    WorkItemResponse create(UUID projectId, UUID actorId, WorkItemCreateRequest request);

    Page<WorkItemResponse> list(
            UUID projectId, UUID requesterId, UUID statusId, UUID assigneeId, UUID reporterId, UUID sprintId,
            String priority, String q, Pageable pageable
    );

    WorkItemResponse get(UUID id, UUID requesterId);

    WorkItemResponse update(UUID id, UUID actorId, WorkItemUpdateRequest request);

    WorkItemResponse updateStatus(UUID id, UUID actorId, UUID newStatusId);

    WorkItemResponse updateAssignee(UUID id, UUID actorId, UUID newAssigneeId);

    // gated by WORK_ITEM_EDIT (not WORK_ITEM_ASSIGN) - this is a corrective
    // edit to who's on record as having reported the item, not a work
    // assignment, so it doesn't notify anyone and it's logged like any other
    // field edit (title/description/priority/dueDate).
    WorkItemResponse updateReporter(UUID id, UUID actorId, UUID newReporterId);

    // newSprintId may be null - that moves the item back to the backlog.
    // Gated by WORK_ITEM_EDIT, logged to the activity trail, no notification
    // (same rationale as updateReporter - this is planning, not assignment).
    WorkItemResponse updateSprint(UUID id, UUID actorId, UUID newSprintId);

    void delete(UUID id, UUID actorId);

    Page<WorkItemActivityResponse> getActivity(UUID id, UUID requesterId, Pageable pageable);
}
