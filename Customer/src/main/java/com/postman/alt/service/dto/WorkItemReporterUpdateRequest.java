package com.postman.alt.service.dto;

import java.util.UUID;

/**
 * reporterId may be null - that clears the reporter back to unassigned,
 * same nullable-to-clear convention as WorkItemAssigneeUpdateRequest.
 */
public record WorkItemReporterUpdateRequest(
        UUID reporterId
) {
}
