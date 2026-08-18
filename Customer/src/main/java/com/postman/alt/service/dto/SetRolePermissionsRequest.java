package com.postman.alt.service.dto;

import jakarta.validation.constraints.NotNull;

import java.util.Set;

public record SetRolePermissionsRequest(
        @NotNull Set<String> permissionCodes
) {
}
