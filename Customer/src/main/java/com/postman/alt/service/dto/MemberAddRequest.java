package com.postman.alt.service.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record MemberAddRequest(
        @NotNull UUID userId,
        @NotNull UUID roleId
) {
}
