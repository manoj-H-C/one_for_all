package com.postman.alt.service.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record CommentResponse(
        UUID id,
        UUID workItemId,
        UUID authorId,
        String authorName,
        String body,
        Long timecodeMs,
        List<UUID> mentionedUserIds,
        Instant createdAt
) {
}
