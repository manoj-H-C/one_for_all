package com.postman.alt.service.dto;

public record OrganizationMemberBulkCreateFailure(
        int rowNumber,
        String name,
        String email,
        String reason
) {
}
