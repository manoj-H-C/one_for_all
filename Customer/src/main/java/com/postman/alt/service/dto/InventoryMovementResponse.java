package com.postman.alt.service.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record InventoryMovementResponse(
        UUID id,
        UUID materialId,
        String materialName,
        String unit,
        UUID locationId,
        String locationName,
        BigDecimal quantity,
        String type,
        String note,
        UUID workItemId,
        UUID recordedById,
        String recordedByName,
        Instant recordedAt
) {
}
