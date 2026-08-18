package com.postman.alt.service.dto;

import jakarta.validation.constraints.NotBlank;

// registers an attachment pointing at an already-hosted file - the client
// uploads the bytes to blob storage itself and hands us the resulting URL,
// so this API never needs to handle file bytes directly.
public record AttachmentCreateRequest(
        @NotBlank String fileUrl,
        String fileName
) {
}
