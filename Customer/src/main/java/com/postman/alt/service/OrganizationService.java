package com.postman.alt.service;

import com.postman.alt.service.dto.OrganizationInvitationCreateRequest;
import com.postman.alt.service.dto.OrganizationInvitationResponse;
import com.postman.alt.service.dto.OrganizationMemberCreateRequest;
import com.postman.alt.service.dto.OrganizationMemberCreateResponse;
import com.postman.alt.service.dto.OrganizationMemberResponse;

import java.util.List;
import java.util.UUID;

public interface OrganizationService {

    void setProjectCreationAccess(UUID targetUserId, UUID requesterId, boolean canCreateProjects);

    void setMemberManagementAccess(UUID targetUserId, UUID requesterId, boolean canManageMembers);

    List<OrganizationMemberResponse> listMembers(UUID requesterId);

    // creates the AppUser immediately with a system-generated temporary
    // password (mustResetPassword = true), instead of an invitation the
    // person has to redeem themselves - same requireAdmin gate and
    // global-email-uniqueness check as createInvitation.
    OrganizationMemberCreateResponse createMember(UUID requesterId, OrganizationMemberCreateRequest request);

    OrganizationInvitationResponse createInvitation(UUID requesterId, OrganizationInvitationCreateRequest request);

    List<OrganizationInvitationResponse> listInvitations(UUID requesterId);

    void revokeInvitation(UUID invitationId, UUID requesterId);
}
