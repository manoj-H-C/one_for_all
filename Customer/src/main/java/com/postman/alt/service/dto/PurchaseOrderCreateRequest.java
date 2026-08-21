package com.postman.alt.service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;
import java.util.UUID;

public record PurchaseOrderCreateRequest(
        @NotBlank String vendorName,
        String note,
        @NotEmpty List<UUID> requestIds
) {
}
