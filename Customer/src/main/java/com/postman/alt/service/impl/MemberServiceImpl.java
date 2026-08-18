package com.postman.alt.service.impl;

import com.postman.alt.entity.ProjectMember;
import com.postman.alt.entity.ProjectMemberId;
import com.postman.alt.entity.ProjectRole;
import com.postman.alt.exception.ResourceNotFoundException;
import com.postman.alt.repository.ProjectMemberRepository;
import com.postman.alt.repository.ProjectRoleRepository;
import com.postman.alt.service.MemberService;
import com.postman.alt.service.ProjectAccessService;
import com.postman.alt.service.dto.MemberResponse;
import com.postman.alt.service.dto.UpdateMemberRoleRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class MemberServiceImpl implements MemberService {

    // there's no dedicated "manage membership" permission code - assigning a
    // role at invite time and re-assigning one later are the same kind of
    // action, so both route through MEMBER_INVITE.
    private static final String MEMBER_INVITE = "MEMBER_INVITE";
    private static final String MEMBER_REMOVE = "MEMBER_REMOVE";

    private final ProjectMemberRepository projectMemberRepository;
    private final ProjectRoleRepository projectRoleRepository;
    private final ProjectAccessService projectAccessService;

    public MemberServiceImpl(
            ProjectMemberRepository projectMemberRepository,
            ProjectRoleRepository projectRoleRepository,
            ProjectAccessService projectAccessService
    ) {
        this.projectMemberRepository = projectMemberRepository;
        this.projectRoleRepository = projectRoleRepository;
        this.projectAccessService = projectAccessService;
    }

    @Override
    public List<MemberResponse> list(UUID projectId, UUID requesterId) {
        projectAccessService.requireMember(projectId, requesterId);
        return projectMemberRepository.findByProjectId(projectId).stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional
    public MemberResponse updateRole(UUID projectId, UUID userId, UUID requesterId, UpdateMemberRoleRequest request) {
        projectAccessService.requirePermission(projectId, requesterId, MEMBER_INVITE);
        ProjectMember member = getMember(projectId, userId);

        ProjectRole role = projectRoleRepository.findById(request.roleId())
                .orElseThrow(() -> new ResourceNotFoundException("ProjectRole", request.roleId()));
        if (!role.getProject().getId().equals(projectId)) {
            throw new ResourceNotFoundException("ProjectRole", request.roleId());
        }

        member.setRole(role);
        return toResponse(member);
    }

    @Override
    @Transactional
    public void remove(UUID projectId, UUID userId, UUID requesterId) {
        projectAccessService.requirePermission(projectId, requesterId, MEMBER_REMOVE);
        ProjectMember member = getMember(projectId, userId);
        projectMemberRepository.delete(member);
    }

    private ProjectMember getMember(UUID projectId, UUID userId) {
        return projectMemberRepository.findById(new ProjectMemberId(projectId, userId))
                .orElseThrow(() -> new ResourceNotFoundException("ProjectMember", userId));
    }

    private MemberResponse toResponse(ProjectMember member) {
        return new MemberResponse(
                member.getUser().getId(),
                member.getUser().getName(),
                member.getUser().getEmail(),
                member.getRole().getId(),
                member.getRole().getName()
        );
    }
}
