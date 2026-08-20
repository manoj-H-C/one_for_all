package com.postman.alt.service.dto;

import java.util.List;

public record OrganizationInvitationBulkCreateRequest(
        List<OrganizationInvitationBulkCreateRow> rows
) {
}
