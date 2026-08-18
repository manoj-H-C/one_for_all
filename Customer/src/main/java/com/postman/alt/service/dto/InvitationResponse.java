package com.postman.alt.service.dto;

import java.time.Instant;
import java.util.UUID;

// token is intentionally never included - it's delivered out-of-band (see
// AuthServiceImpl's password-reset token for the same pattern) so listing
// invitations can't be used to steal one.
public record InvitationResponse(
        UUID id,
        UUID projectId,
        String email,
        UUID roleId,
        String roleName,
        String status,
        Instant expiresAt,
        Instant createdAt
) {
}
