package com.postman.alt.service.dto;

import java.math.BigDecimal;

public record InventoryMaterialUpdateRequest(
        String name,
        String unit,
        String sku,
        BigDecimal lowStockThreshold,
        String description
) {
}
