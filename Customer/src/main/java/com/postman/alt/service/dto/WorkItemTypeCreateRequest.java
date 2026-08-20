package com.postman.alt.service.dto;

import jakarta.validation.constraints.NotBlank;

public record WorkItemTypeCreateRequest(
        @NotBlank String name
) {
}
