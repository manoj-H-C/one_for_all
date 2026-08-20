package com.postman.alt.service.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record UpdateMemberRoleRequest(
        @NotNull UUID roleId
) {
}
