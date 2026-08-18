package com.postman.alt.service.dto;

import jakarta.validation.constraints.NotBlank;

public record CommentCreateRequest(
        @NotBlank String body,
        Long timecodeMs
) {
}
