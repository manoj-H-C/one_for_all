package com.postman.alt.service.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.List;
import java.util.UUID;

/**
 * mentionedUserIds is optional - each id must be an existing member of the
 * work item's project (same rule as assigneeId/reporterId). The client picks
 * these from an autocomplete rather than the server parsing @-mentions out
 * of body text.
 */
public record CommentCreateRequest(
        @NotBlank String body,
        Long timecodeMs,
        List<UUID> mentionedUserIds
) {
}
