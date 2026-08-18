package com.postman.alt.service.dto;

import java.time.Instant;
import java.util.UUID;

public record AttachmentResponse(
        UUID id,
        UUID workItemId,
        String fileUrl,
        String fileName,
        UUID uploadedById,
        String uploadedByName,
        Instant createdAt
) {
}
