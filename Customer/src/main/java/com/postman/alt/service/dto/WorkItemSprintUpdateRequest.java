package com.postman.alt.service.dto;

import java.util.UUID;

/**
 * sprintId may be null - that moves the item back to the backlog, same
 * nullable-to-clear convention as WorkItemAssigneeUpdateRequest.
 */
public record WorkItemSprintUpdateRequest(
        UUID sprintId
) {
}
