package com.postman.alt.service.dto;

import java.time.Instant;
import java.util.UUID;

public record OrganizationMemberResponse(
        UUID id,
        String name,
        String email,
        boolean owner,
        boolean canCreateProjects,
        boolean canManageMembers,
        Instant createdAt
) {
}
