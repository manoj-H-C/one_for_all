package com.postman.alt.service.dto;

// both fields are update-if-non-null (Boolean, not boolean, so "not sent"
// and "explicitly false" are distinguishable) - same pattern as
// ProjectUpdateRequest.inventoryEnabled.
public record OrganizationSettingsUpdateRequest(
        String name,
        Boolean purchaseOrdersEnabled
) {
}
