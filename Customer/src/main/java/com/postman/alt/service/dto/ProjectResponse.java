package com.postman.alt.service.dto;

import java.time.Instant;
import java.util.UUID;

public record ProjectResponse(
        UUID id,
        UUID orgId,
        String name,
        String key,
        String templateType,
        String itemDisplayNameSingular,
        String itemDisplayNamePlural,
        String sprintLabelSingular,
        String sprintLabelPlural,
        boolean inventoryEnabled,
        String inventoryLabelSingular,
        String inventoryLabelPlural,
        Instant createdAt
) {
}
