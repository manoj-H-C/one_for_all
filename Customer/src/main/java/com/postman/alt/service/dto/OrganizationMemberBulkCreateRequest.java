package com.postman.alt.service.dto;

import java.util.List;

public record OrganizationMemberBulkCreateRequest(
        List<OrganizationMemberBulkCreateRow> rows
) {
}
