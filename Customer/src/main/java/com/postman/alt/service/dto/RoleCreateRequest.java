package com.postman.alt.service.dto;

import jakarta.validation.constraints.NotBlank;

public record RoleCreateRequest(
        @NotBlank String name,
        String description
) {
}
