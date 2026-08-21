package com.postman.alt.service.dto;

import java.util.UUID;

public record OrganizationSettingsResponse(
        UUID id,
        String name,
        boolean purchaseOrdersEnabled
) {
}
