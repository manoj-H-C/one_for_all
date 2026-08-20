package com.postman.alt.service.dto;

import java.util.Set;
import java.util.UUID;

public record RoleResponse(
        UUID id,
        UUID projectId,
        String name,
        String description,
        Set<String> permissionCodes
) {
}
