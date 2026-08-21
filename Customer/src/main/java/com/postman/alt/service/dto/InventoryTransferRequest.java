package com.postman.alt.service.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Moves stock from one location straight to another - the alternative to
 * manually logging a USED at the source and an ALLOCATED at the destination
 * yourself. Produces exactly those two ledger entries atomically, each with
 * an auto-generated note naming the other location, so the transfer reads
 * clearly in the history even though it's still just two ordinary movements
 * under the hood.
 */
public record InventoryTransferRequest(
        @NotNull UUID materialId,
        @NotNull UUID fromLocationId,
        @NotNull UUID toLocationId,
        @NotNull BigDecimal quantity,
        String note
) {
}
