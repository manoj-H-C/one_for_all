package com.postman.alt.service.dto;

import java.util.UUID;

public record WorkflowStatusResponse(
        UUID id,
        UUID projectId,
        String name,
        int sortOrder,
        UUID categoryId,
        String categoryName
) {
}
