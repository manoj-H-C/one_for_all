package com.postman.alt.service;

import com.postman.alt.service.dto.MemberAddRequest;
import com.postman.alt.service.dto.MemberResponse;
import com.postman.alt.service.dto.UpdateMemberRoleRequest;

import java.util.List;
import java.util.UUID;

public interface MemberService {

    List<MemberResponse> list(UUID projectId, UUID requesterId);

    // adds an existing org member straight onto the project, skipping the
    // invitation/accept round-trip - the owner already knows who they want.
    MemberResponse add(UUID projectId, UUID requesterId, MemberAddRequest request);

    MemberResponse updateRole(UUID projectId, UUID userId, UUID requesterId, UpdateMemberRoleRequest request);

    void remove(UUID projectId, UUID userId, UUID requesterId);
}
