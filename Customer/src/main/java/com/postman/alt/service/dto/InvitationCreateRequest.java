package com.postman.alt.service.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record InvitationCreateRequest(
        @NotBlank @Email String email,
        @NotNull UUID roleId
) {
}
