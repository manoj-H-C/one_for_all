package com.postman.alt.service.dto;

// rowNumber is the spreadsheet row the client parsed this from (matching what
// the person sees when they open the file in Excel) - carried through purely
// so a failure can be reported back against the row they'd recognize, not an
// internal 0-based array index.
public record OrganizationMemberBulkCreateRow(
        int rowNumber,
        String name,
        String email,
        boolean canCreateProjects,
        boolean canManageMembers
) {
}
