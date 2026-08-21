package com.postman.alt.service.dto;

import com.postman.alt.entity.Notification;

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
    // shared by the list/mark-read read path (NotificationServiceImpl) and
    // the live SSE push path, so both ever describe a notification the same
    // way. Only safe to call while the entity's recipient/workItem/actor are
    // already-loaded objects (not lazy proxies) - true for every call site
    // today, since they're always built from entities just fetched/passed
    // in, never a bare reference.
    public static NotificationResponse from(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getWorkItem() != null ? notification.getWorkItem().getId() : null,
                notification.getActor() != null ? notification.getActor().getId() : null,
                notification.getActor() != null ? notification.getActor().getName() : null,
                notification.getType().name(),
                notification.getMessage(),
                notification.isRead(),
                notification.getCreatedAt()
        );
    }
}
