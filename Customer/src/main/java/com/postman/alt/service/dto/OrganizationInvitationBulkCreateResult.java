package com.postman.alt.service.dto;

import java.util.List;

public record OrganizationInvitationBulkCreateResult(
        List<OrganizationInvitationResponse> created,
        List<OrganizationInvitationBulkCreateFailure> failed
) {
}
