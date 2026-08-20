package com.postman.alt.service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record OrganizationInvitationAcceptRequest(
        @NotBlank String name,
        @NotBlank @Size(min = 8, max = 255) String password
) {
}
