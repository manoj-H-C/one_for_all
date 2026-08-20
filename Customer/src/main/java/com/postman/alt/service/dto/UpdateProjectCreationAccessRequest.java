package com.postman.alt.service.dto;

import jakarta.validation.constraints.NotNull;

public record UpdateProjectCreationAccessRequest(
        @NotNull Boolean canCreateProjects
) {
}
