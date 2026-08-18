package com.postman.alt.service.dto;

import java.time.Instant;
import java.util.UUID;

// token is intentionally never included - same rationale as
// InvitationResponse (project invitations): delivered out-of-band, so
// listing invitations can't be used to steal one.
public record OrganizationInvitationResponse(
        UUID id,
        UUID orgId,
        String email,
        UUID invitedById,
        boolean canCreateProjects,
        boolean canManageMembers,
        String status,
        Instant expiresAt,
        Instant createdAt
) {
}
