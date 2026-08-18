package com.postman.alt.service.impl;

import com.postman.alt.entity.AppUser;
import com.postman.alt.entity.Project;
import com.postman.alt.entity.ProjectInvitation;
import com.postman.alt.entity.ProjectMember;
import com.postman.alt.entity.ProjectMemberId;
import com.postman.alt.entity.ProjectRole;
import com.postman.alt.enums.InvitationStatus;
import com.postman.alt.exception.BadRequestException;
import com.postman.alt.exception.ConflictException;
import com.postman.alt.exception.ForbiddenException;
import com.postman.alt.exception.ResourceNotFoundException;
import com.postman.alt.repository.AppUserRepository;
import com.postman.alt.repository.ProjectInvitationRepository;
import com.postman.alt.repository.ProjectMemberRepository;
import com.postman.alt.repository.ProjectRepository;
import com.postman.alt.repository.ProjectRoleRepository;
import com.postman.alt.service.InvitationService;
import com.postman.alt.service.ProjectAccessService;
import com.postman.alt.service.dto.InvitationCreateRequest;
import com.postman.alt.service.dto.InvitationResponse;
import com.postman.alt.service.dto.MemberResponse;
import com.postman.alt.service.support.TokenGenerator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
public class InvitationServiceImpl implements InvitationService {

    private static final Logger log = LoggerFactory.getLogger(InvitationServiceImpl.class);
    private static final String MEMBER_INVITE = "MEMBER_INVITE";

    private final ProjectInvitationRepository projectInvitationRepository;
    private final ProjectRoleRepository projectRoleRepository;
    private final ProjectRepository projectRepository;
    private final AppUserRepository appUserRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final ProjectAccessService projectAccessService;

    public InvitationServiceImpl(
            ProjectInvitationRepository projectInvitationRepository,
            ProjectRoleRepository projectRoleRepository,
            ProjectRepository projectRepository,
            AppUserRepository appUserRepository,
            ProjectMemberRepository projectMemberRepository,
            ProjectAccessService projectAccessService
    ) {
        this.projectInvitationRepository = projectInvitationRepository;
        this.projectRoleRepository = projectRoleRepository;
        this.projectRepository = projectRepository;
        this.appUserRepository = appUserRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.projectAccessService = projectAccessService;
    }

    @Override
    @Transactional
    public InvitationResponse create(UUID projectId, UUID requesterId, InvitationCreateRequest request) {
        projectAccessService.requirePermission(projectId, requesterId, MEMBER_INVITE);

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", projectId));
        ProjectRole role = projectRoleRepository.findById(request.roleId())
                .orElseThrow(() -> new ResourceNotFoundException("ProjectRole", request.roleId()));
        if (!role.getProject().getId().equals(projectId)) {
            throw new ResourceNotFoundException("ProjectRole", request.roleId());
        }
        AppUser invitedBy = appUserRepository.findById(requesterId)
                .orElseThrow(() -> new ResourceNotFoundException("AppUser", requesterId));

        if (projectInvitationRepository.existsByProjectIdAndEmailAndStatus(projectId, request.email(), InvitationStatus.PENDING)) {
            throw new ConflictException("There is already a pending invitation for this email");
        }

        ProjectInvitation invitation = new ProjectInvitation(
                project, request.email(), role, invitedBy,
                TokenGenerator.generate(), Instant.now().plus(7, ChronoUnit.DAYS)
        );
        invitation = projectInvitationRepository.save(invitation);

        // stand-in for actually emailing the invite link until a real
        // provider is wired up - never returned via the API response.
        log.info("Invitation created for {} to project {}: token={}", request.email(), projectId, invitation.getToken());

        return toResponse(invitation);
    }

    @Override
    public List<InvitationResponse> list(UUID projectId, UUID requesterId) {
        projectAccessService.requirePermission(projectId, requesterId, MEMBER_INVITE);
        return projectInvitationRepository.findByProjectIdAndStatus(projectId, InvitationStatus.PENDING).stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public void revoke(UUID projectId, UUID invitationId, UUID requesterId) {
        projectAccessService.requirePermission(projectId, requesterId, MEMBER_INVITE);
        ProjectInvitation invitation = projectInvitationRepository.findById(invitationId)
                .orElseThrow(() -> new ResourceNotFoundException("ProjectInvitation", invitationId));
        if (!invitation.getProject().getId().equals(projectId)) {
            throw new ResourceNotFoundException("ProjectInvitation", invitationId);
        }
        invitation.setStatus(InvitationStatus.REVOKED);
    }

    @Override
    @Transactional
    public MemberResponse accept(String token, UUID currentUserId) {
        ProjectInvitation invitation = projectInvitationRepository.findByToken(token)
                .orElseThrow(() -> new BadRequestException("Invalid or expired invitation"));

        if (invitation.getStatus() != InvitationStatus.PENDING || invitation.getExpiresAt().isBefore(Instant.now())) {
            throw new BadRequestException("Invalid or expired invitation");
        }

        AppUser user = appUserRepository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("AppUser", currentUserId));
        if (!user.getEmail().equalsIgnoreCase(invitation.getEmail())) {
            throw new ForbiddenException("This invitation was sent to a different email address");
        }

        UUID projectId = invitation.getProject().getId();
        if (projectMemberRepository.findById(new ProjectMemberId(projectId, currentUserId)).isPresent()) {
            throw new ConflictException("Already a member of this project");
        }

        ProjectMember member = projectMemberRepository.save(
                new ProjectMember(invitation.getProject(), user, invitation.getRole())
        );
        invitation.setStatus(InvitationStatus.ACCEPTED);

        return new MemberResponse(
                member.getUser().getId(), member.getUser().getName(), member.getUser().getEmail(),
                member.getRole().getId(), member.getRole().getName()
        );
    }

    private InvitationResponse toResponse(ProjectInvitation invitation) {
        return new InvitationResponse(
                invitation.getId(),
                invitation.getProject().getId(),
                invitation.getEmail(),
                invitation.getRole().getId(),
                invitation.getRole().getName(),
                invitation.getStatus().name(),
                invitation.getExpiresAt(),
                invitation.getCreatedAt()
        );
    }
}
