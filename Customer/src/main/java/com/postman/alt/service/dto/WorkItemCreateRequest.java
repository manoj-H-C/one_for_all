package com.postman.alt.service.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

/**
 * statusId is optional - if omitted, the work item is created in the
 * project's first workflow status (lowest sort_order). priority defaults to
 * MEDIUM (see Priority enum) if omitted. assigneeId and reporterId are both
 * optional - if omitted, the item is left unassigned/unreported; if given,
 * each must be an existing member of this project.
 */
public record WorkItemCreateRequest(
        @NotBlank String title,
        String description,
        UUID statusId,
        UUID assigneeId,
        UUID reporterId,
        // optional - omit to leave it in the backlog. Must be a sprint that
        // belongs to this project when given.
        UUID sprintId,
        // optional - omit to leave it untyped. Must be a WorkItemType that
        // belongs to this project when given.
        UUID typeId,
        String priority,
        LocalDate dueDate,
        Map<String, Object> customFields
) {
}
