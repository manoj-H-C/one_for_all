package com.postman.alt.service.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record SprintResponse(
        UUID id,
        UUID projectId,
        String name,
        LocalDate startDate,
        LocalDate endDate,
        Instant createdAt
) {
}
