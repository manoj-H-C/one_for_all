package com.postman.alt.service.dto;

import java.util.UUID;

public record MemberResponse(
        UUID userId,
        String name,
        String email,
        UUID roleId,
        String roleName
) {
}
