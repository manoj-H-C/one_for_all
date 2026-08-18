package com.postman.alt.service.dto;

import jakarta.validation.constraints.NotBlank;

public record StatusCategoryCreateRequest(
        @NotBlank String name,
        String description
) {
}
