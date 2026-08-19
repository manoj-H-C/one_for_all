package com.postman.alt.service;

import com.postman.alt.service.dto.SprintCreateRequest;
import com.postman.alt.service.dto.SprintResponse;
import com.postman.alt.service.dto.SprintUpdateRequest;

import java.util.List;
import java.util.UUID;

public interface SprintService {

    List<SprintResponse> list(UUID projectId, UUID requesterId);

    SprintResponse create(UUID projectId, UUID requesterId, SprintCreateRequest request);

    SprintResponse update(UUID projectId, UUID sprintId, UUID requesterId, SprintUpdateRequest request);

    // work items assigned to this sprint fall back to the backlog (sprint_id
    // set null via the FK's ON DELETE SET NULL) - no "still in use" guard,
    // unlike workflow status deletion, since that's exactly the intended
    // behavior for a finished/abandoned sprint.
    void delete(UUID projectId, UUID sprintId, UUID requesterId);
}
