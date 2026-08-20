package com.postman.alt.service.dto;

import java.util.List;
import java.util.UUID;

public record CustomFieldResponse(
        UUID id,
        UUID projectId,
        String name,
        String fieldType,
        boolean required,
        List<String> options
) {
}
