package com.postman.alt.service.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record PurchaseOrderLineResponse(
        UUID supplyRequestId,
        UUID projectId,
        String projectName,
        String materialName,
        String unit,
        String locationName,
        BigDecimal quantity,
        UUID requestedById,
        String requestedByName,
        String note
) {
}
