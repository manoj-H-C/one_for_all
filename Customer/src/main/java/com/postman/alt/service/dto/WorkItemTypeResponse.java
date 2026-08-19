package com.postman.alt.service.dto;

import java.time.Instant;
import java.util.UUID;

public record WorkItemTypeResponse(
        UUID id,
        UUID projectId,
        String name,
        Instant createdAt
) {
}
