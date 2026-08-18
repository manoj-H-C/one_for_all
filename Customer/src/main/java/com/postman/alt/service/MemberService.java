package com.postman.alt.service;

import com.postman.alt.service.dto.MemberResponse;
import com.postman.alt.service.dto.UpdateMemberRoleRequest;

import java.util.List;
import java.util.UUID;

public interface MemberService {

    List<MemberResponse> list(UUID projectId, UUID requesterId);

    MemberResponse updateRole(UUID projectId, UUID userId, UUID requesterId, UpdateMemberRoleRequest request);

    void remove(UUID projectId, UUID userId, UUID requesterId);
}
