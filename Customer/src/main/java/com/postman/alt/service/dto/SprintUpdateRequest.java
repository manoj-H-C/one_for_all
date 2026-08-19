package com.postman.alt.service.dto;

import java.time.LocalDate;

public record SprintUpdateRequest(
        String name,
        LocalDate startDate,
        LocalDate endDate
) {
}
