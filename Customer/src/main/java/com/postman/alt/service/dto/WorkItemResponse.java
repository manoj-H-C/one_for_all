package com.postman.alt.service.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

public record WorkItemResponse(
        UUID id,
        UUID projectId,
        UUID statusId,
        String statusName,
        UUID assigneeId,
        UUID reporterId,
        UUID sprintId,
        String sprintName,
        String title,
        String description,
        String priority,
        LocalDate dueDate,
        Map<String, Object> customFields,
        Instant createdAt,
        Instant updatedAt
) {
}
