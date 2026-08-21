package com.postman.alt.service.dto;

import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;

public record InventoryMaterialCreateRequest(
        @NotBlank String name,
        @NotBlank String unit,
        String sku,
        BigDecimal lowStockThreshold,
        String description
) {
}
