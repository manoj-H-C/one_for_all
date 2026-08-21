package com.postman.alt.service.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.UUID;

/** parentLocationId is optional - omit to create a root location. */
public record InventoryLocationCreateRequest(
        @NotBlank String name,
        UUID parentLocationId
) {
}
