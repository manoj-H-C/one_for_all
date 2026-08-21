package com.postman.alt.service.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record InventoryMaterialResponse(
        UUID id,
        UUID projectId,
        String name,
        String unit,
        String sku,
        BigDecimal lowStockThreshold,
        String description,
        Instant createdAt
) {
}
