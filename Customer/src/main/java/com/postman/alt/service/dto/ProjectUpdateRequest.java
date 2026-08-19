package com.postman.alt.service.dto;

/**
 * Partial update - only non-null fields are applied. The project key is
 * intentionally not editable once set (it's baked into how work items are
 * referenced elsewhere).
 */
public record ProjectUpdateRequest(
        String name,
        String itemDisplayNameSingular,
        String itemDisplayNamePlural,
        String sprintLabelSingular,
        String sprintLabelPlural
) {
}
