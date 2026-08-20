package com.postman.alt.service.dto;

public record OrganizationInvitationBulkCreateFailure(
        int rowNumber,
        String email,
        String reason
) {
}
