package com.postman.alt.service;

import com.postman.alt.service.dto.InvitationCreateRequest;
import com.postman.alt.service.dto.InvitationResponse;
import com.postman.alt.service.dto.MemberResponse;

import java.util.List;
import java.util.UUID;

public interface InvitationService {

    InvitationResponse create(UUID projectId, UUID requesterId, InvitationCreateRequest request);

    List<InvitationResponse> list(UUID projectId, UUID requesterId);

    void revoke(UUID projectId, UUID invitationId, UUID requesterId);

    // token comes from the invite link, not scoped to a project the caller
    // is already a member of - that's the whole point of an invitation.
    MemberResponse accept(String token, UUID currentUserId);
}
