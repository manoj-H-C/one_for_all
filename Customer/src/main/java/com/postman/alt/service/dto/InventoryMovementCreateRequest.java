package com.postman.alt.service.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * type must be one of MovementType's names (ALLOCATED/USED/RETURNED).
 * workItemId is optional - ties this movement to the task it was used for.
 */
public record InventoryMovementCreateRequest(
        @NotNull UUID materialId,
        @NotNull UUID locationId,
        @NotNull BigDecimal quantity,
        @NotBlank String type,
        String note,
        UUID workItemId
) {
}
