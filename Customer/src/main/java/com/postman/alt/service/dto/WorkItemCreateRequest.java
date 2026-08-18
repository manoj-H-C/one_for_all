package com.postman.alt.service.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

/**
 * statusId is optional - if omitted, the work item is created in the
 * project's first workflow status (lowest sort_order). priority defaults to
 * MEDIUM (see Priority enum) if omitted.
 */
public record WorkItemCreateRequest(
        @NotBlank String title,
        String description,
        UUID statusId,
        UUID assigneeId,
        String priority,
        LocalDate dueDate,
        Map<String, Object> customFields
) {
}
