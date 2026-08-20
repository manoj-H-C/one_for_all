package com.postman.alt.service.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

public record SprintCreateRequest(
        @NotBlank String name,
        LocalDate startDate,
        LocalDate endDate
) {
}
