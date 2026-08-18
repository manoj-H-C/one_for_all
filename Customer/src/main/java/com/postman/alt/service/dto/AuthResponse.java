package com.postman.alt.service.dto;

import java.util.UUID;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        UUID userId,
        UUID orgId,
        String email,
        String name
) {
}
