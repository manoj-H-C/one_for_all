package com.postman.alt.service.dto;

import java.time.Instant;
import java.util.UUID;

public record NotificationResponse(
        UUID id,
        UUID workItemId,
        UUID actorId,
        String actorName,
        String type,
        String message,
        boolean read,
        Instant createdAt
) {
}
