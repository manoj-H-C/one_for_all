package com.postman.alt.service.dto;

public record OrganizationInvitationBulkCreateRow(
        int rowNumber,
        String email,
        boolean canCreateProjects,
        boolean canManageMembers
) {
}
