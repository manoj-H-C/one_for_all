package com.postman.alt.service.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record SupplyRequestCreateRequest(
        @NotNull UUID materialId,
        @NotNull UUID locationId,
        @NotNull BigDecimal quantity,
        String note
) {
}
