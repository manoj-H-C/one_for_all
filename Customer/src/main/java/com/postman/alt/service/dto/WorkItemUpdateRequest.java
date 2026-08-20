package com.postman.alt.service.dto;

import java.time.LocalDate;
import java.util.Map;

/**
 * Partial update for everything except status/assignee, which have their own
 * endpoints (they carry side effects - activity log + notification - that
 * deserve to be explicit rather than buried in a general PATCH).
 */
public record WorkItemUpdateRequest(
        String title,
        String description,
        String priority,
        LocalDate dueDate,
        Map<String, Object> customFields
) {
}
