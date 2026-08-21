package com.postman.alt.service.dto;

import java.time.Instant;
import java.util.UUID;

public record ReminderResponse(
        UUID id,
        UUID workItemId,
        String workItemTitle,
        UUID projectId,
        String projectName,
        Instant remindAt,
        String note,
        String status,
        Instant createdAt
) {
}
