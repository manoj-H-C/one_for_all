package com.postman.alt.service.dto;

import java.math.BigDecimal;
import java.util.UUID;

/** Computed by summing InventoryMovement rows, never stored - see InventoryServiceImpl.listBalances. */
public record InventoryBalanceResponse(
        UUID materialId,
        String materialName,
        String unit,
        UUID locationId,
        String locationName,
        BigDecimal allocated,
        BigDecimal used,
        BigDecimal returned,
        BigDecimal remaining
) {
}
