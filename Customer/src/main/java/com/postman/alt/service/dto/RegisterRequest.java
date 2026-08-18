package com.postman.alt.service.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Self-service signup: creates a brand-new Organization plus its first
 * AppUser, who becomes that org's owner. There is no separate "create org"
 * endpoint - registering IS creating an org.
 */
public record RegisterRequest(
        @NotBlank String orgName,
        @NotBlank String name,
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8, max = 255) String password
) {
}
