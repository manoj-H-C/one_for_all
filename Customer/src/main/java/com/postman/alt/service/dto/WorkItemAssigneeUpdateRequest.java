package com.postman.alt.service.dto;

import java.util.UUID;

/**
 * assigneeId may be null - that unassigns the work item.
 */
public record WorkItemAssigneeUpdateRequest(
        UUID assigneeId
) {
}
