package com.postman.alt.service.dto;

import java.util.UUID;

/** Body for PATCH /api/work-items/{id}/type - null clears it back to "no type". */
public record WorkItemTypeAssignRequest(
        UUID typeId
) {
}
