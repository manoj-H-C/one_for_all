package com.postman.alt.service.dto;

import java.time.Instant;
import java.util.UUID;

public record ReminderResponse(
        UUID id,
        // null for a standalone reminder - not about any work item
        UUID workItemId,
        String workItemTitle,
        UUID projectId,
        String projectName,
        // always populated: the work item's title, or the reminder's own
        // title when standalone - what the UI should actually display
        String title,
        Instant remindAt,
        String note,
        String status,
        Instant createdAt
) {
}
