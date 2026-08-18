package com.postman.alt.service.dto;

import java.util.UUID;

public record WorkflowStatusUpdateRequest(
        String name,
        Integer sortOrder,
        UUID categoryId
) {
}
