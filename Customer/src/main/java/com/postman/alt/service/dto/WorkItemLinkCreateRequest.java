package com.postman.alt.service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record WorkItemLinkCreateRequest(
        @NotNull UUID targetWorkItemId,
        @NotBlank String linkType
) {
}
