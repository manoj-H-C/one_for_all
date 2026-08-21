package com.postman.alt.service.dto;

import jakarta.validation.constraints.NotNull;

import java.time.Instant;

public record ReminderCreateRequest(
        @NotNull Instant remindAt,
        String note,
        // only read by the standalone create endpoint (POST /api/reminders) -
        // ignored when creating a reminder scoped to a work item, since that
        // one always displays the work item's own title instead.
        String title
) {
}
