package com.postman.alt.service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record WorkflowStatusCreateRequest(
        @NotBlank String name,
        int sortOrder,
        @NotNull UUID categoryId
) {
}
