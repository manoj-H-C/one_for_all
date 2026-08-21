package com.postman.alt.service.dto;

import java.time.Instant;
import java.util.UUID;

public record InventoryLocationResponse(
        UUID id,
        UUID projectId,
        UUID parentLocationId,
        String name,
        Instant createdAt
) {
}
