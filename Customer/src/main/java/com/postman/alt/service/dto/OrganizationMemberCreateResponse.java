package com.postman.alt.service.dto;

import java.time.Instant;
import java.util.UUID;

// temporaryPassword is deliberately included here, unlike every invitation
// token in this codebase - it's returned exactly once, synchronously, to the
// admin who just created the account so they can relay it out-of-band. It is
// never persisted (only its bcrypt hash is) and this response is the only
// place it ever appears.
public record OrganizationMemberCreateResponse(
        UUID id,
        String name,
        String email,
        boolean canCreateProjects,
        boolean canManageMembers,
        String temporaryPassword,
        Instant createdAt
) {
}
