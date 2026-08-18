package com.postman.alt.service.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record WorkItemStatusUpdateRequest(
        @NotNull UUID statusId
) {
}
