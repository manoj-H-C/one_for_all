package com.postman.alt.service.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record SupplyRequestResponse(
        UUID id,
        UUID projectId,
        UUID materialId,
        String materialName,
        String unit,
        UUID locationId,
        String locationName,
        BigDecimal quantity,
        String status,
        String note,
        UUID requestedById,
        String requestedByName,
        Instant requestedAt,
        String decisionNote,
        UUID decidedById,
        String decidedByName,
        Instant decidedAt,
        UUID fulfilledMovementId
) {
}
