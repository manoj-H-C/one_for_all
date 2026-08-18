package com.postman.alt.service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record CustomFieldCreateRequest(
        @NotBlank String name,
        @NotNull String fieldType,
        boolean required,
        List<String> options
) {
}
