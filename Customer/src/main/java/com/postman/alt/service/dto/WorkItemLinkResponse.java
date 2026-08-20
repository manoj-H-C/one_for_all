package com.postman.alt.service.dto;

import java.time.Instant;
import java.util.UUID;

public record WorkItemLinkResponse(
        UUID id,
        UUID sourceWorkItemId,
        UUID targetWorkItemId,
        String linkType,
        UUID createdById,
        Instant createdAt
) {
}
