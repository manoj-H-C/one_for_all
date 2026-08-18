package com.postman.alt.service.dto;

import java.time.Instant;
import java.util.UUID;

public record UserResponse(
        UUID id,
        UUID orgId,
        String email,
        String name,
        boolean owner,
        boolean canCreateProjects,
        boolean canManageMembers,
        boolean emailVerified,
        Instant createdAt
) {
}
