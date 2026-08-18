package com.postman.alt.service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProjectCreateRequest(
        @NotBlank String name,
        @NotBlank @Size(max = 50) String key,
        String templateType
) {
}
