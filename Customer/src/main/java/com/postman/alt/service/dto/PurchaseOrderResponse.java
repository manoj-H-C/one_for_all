package com.postman.alt.service.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record PurchaseOrderResponse(
        UUID id,
        UUID organizationId,
        String vendorName,
        String note,
        String status,
        UUID createdById,
        String createdByName,
        Instant createdAt,
        UUID closedById,
        String closedByName,
        Instant closedAt,
        List<PurchaseOrderLineResponse> lines
) {
}
