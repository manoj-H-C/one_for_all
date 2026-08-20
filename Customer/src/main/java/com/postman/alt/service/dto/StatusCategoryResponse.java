package com.postman.alt.service.dto;

import java.util.UUID;

public record StatusCategoryResponse(
        UUID id,
        UUID projectId,
        String name,
        String description,
        String color
) {
}
