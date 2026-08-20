package com.postman.alt.service.dto;

import java.util.List;

public record OrganizationMemberBulkCreateResult(
        List<OrganizationMemberCreateResponse> created,
        List<OrganizationMemberBulkCreateFailure> failed
) {
}
