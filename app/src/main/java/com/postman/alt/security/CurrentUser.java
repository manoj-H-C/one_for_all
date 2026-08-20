package com.postman.alt.security;

import com.postman.alt.exception.UnauthorizedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.UUID;

/**
 * Reads the authenticated AppUser id that JwtAuthenticationFilter placed in
 * the SecurityContext, so controllers don't need to parse tokens themselves.
 */
public final class CurrentUser {

    private CurrentUser() {
    }

    public static UUID id() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UUID userId)) {
            throw new UnauthorizedException("Not authenticated");
        }
        return userId;
    }
}
