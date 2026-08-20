package com.postman.alt.service.dto;

import java.time.Instant;
import java.util.UUID;

public record WorkItemActivityResponse(
        UUID id,
        UUID actorId,
        String actorName,
        String fieldName,
        String oldValue,
        String newValue,
        Instant createdAt
) {
}
