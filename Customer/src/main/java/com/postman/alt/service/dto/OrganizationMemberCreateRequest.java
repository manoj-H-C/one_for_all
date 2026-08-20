package com.postman.alt.service.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record OrganizationMemberCreateRequest(
        @NotBlank String name,
        @NotBlank @Email String email,
        boolean canCreateProjects,
        boolean canManageMembers
) {
}
