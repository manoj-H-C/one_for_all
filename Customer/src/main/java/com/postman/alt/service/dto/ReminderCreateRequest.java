package com.postman.alt.service.dto;

import jakarta.validation.constraints.NotNull;

import java.time.Instant;

public record ReminderCreateRequest(
        @NotNull Instant remindAt,
        String note
) {
}
