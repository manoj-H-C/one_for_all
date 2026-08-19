package com.postman.alt.service.impl;

import com.postman.alt.entity.AppUser;
import com.postman.alt.entity.OrganizationInvitation;
import com.postman.alt.enums.InvitationStatus;
import com.postman.alt.exception.ConflictException;
import com.postman.alt.exception.ForbiddenException;
import com.postman.alt.exception.ResourceNotFoundException;
import com.postman.alt.repository.AppUserRepository;
import com.postman.alt.repository.OrganizationInvitationRepository;
import com.postman.alt.repository.ProjectMemberRepository;
import com.postman.alt.service.OrganizationService;
import com.postman.alt.service.dto.OrganizationInvitationCreateRequest;
import com.postman.alt.service.dto.OrganizationInvitationResponse;
import com.postman.alt.service.dto.OrganizationMemberCreateRequest;
import com.postman.alt.service.dto.OrganizationMemberCreateResponse;
import com.postman.alt.service.dto.OrganizationMemberResponse;
import com.postman.alt.service.support.TokenGenerator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
public class OrganizationServiceImpl implements OrganizationService {

    private static final Logger log = LoggerFactory.getLogger(OrganizationServiceImpl.class);

    private final AppUserRepository appUserRepository;
    private final OrganizationInvitationRepository organizationInvitationRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final PasswordEncoder passwordEncoder;

    public OrganizationServiceImpl(
            AppUserRepository appUserRepository,
            OrganizationInvitationRepository organizationInvitationRepository,
            ProjectMemberRepository projectMemberRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.appUserRepository = appUserRepository;
        this.organizationInvitationRepository = organizationInvitationRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void setProjectCreationAccess(UUID targetUserId, UUID requesterId, boolean canCreateProjects) {
        AppUser requester = requireAdmin(requesterId);
        AppUser target = getSameOrgUser(requester, targetUserId);
        target.setCanCreateProjects(canCreateProjects);
    }

    @Override
    @Transactional
    public void setMemberManagementAccess(UUID targetUserId, UUID requesterId, boolean canManageMembers) {
        AppUser requester = getUser(requesterId);
        // deliberately owner-only, unlike setProjectCreationAccess - an
        // admin being able to mint other admins would let privilege chain
        // outward with no one person able to see the whole picture.
        if (!requester.isOwner()) {
            throw new ForbiddenException("Only the organization owner can grant member-management access");
        }
        AppUser target = getSameOrgUser(requester, targetUserId);
        target.setCanManageMembers(canManageMembers);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrganizationMemberResponse> listMembers(UUID requesterId) {
        AppUser requester = requireAdmin(requesterId);
        return appUserRepository.findByOrganizationIdAndDeletedAtIsNull(requester.getOrganization().getId()).stream()
                .map(this::toMemberResponse)
                .toList();
    }

    @Override
    @Transactional
    public OrganizationMemberCreateResponse createMember(UUID requesterId, OrganizationMemberCreateRequest request) {
        AppUser requester = requireAdmin(requesterId);

        // same global-uniqueness rule as createInvitation/register - a
        // person can only ever belong to one org.
        if (appUserRepository.findByEmail(request.email()).isPresent()) {
            throw new ConflictException("An account with this email already exists");
        }

        String temporaryPassword = TokenGenerator.generateTemporaryPassword();
        AppUser user = new AppUser(
                requester.getOrganization(), request.email(), request.name(),
                passwordEncoder.encode(temporaryPassword)
        );
        user.setCanCreateProjects(request.canCreateProjects());
        user.setCanManageMembers(request.canManageMembers());
        user.setMustResetPassword(true);
        user = appUserRepository.save(user);

        // never log the password itself, only that an account was created.
        log.info("Org member {} (id={}) created directly by {} with a temporary password",
                user.getEmail(), user.getId(), requesterId);

        return new OrganizationMemberCreateResponse(
                user.getId(), user.getName(), user.getEmail(),
                user.isCanCreateProjects(), user.isCanManageMembers(),
                temporaryPassword, user.getCreatedAt()
        );
    }

    @Override
    @Transactional
    public OrganizationInvitationResponse createInvitation(UUID requesterId, OrganizationInvitationCreateRequest request) {
        AppUser requester = requireAdmin(requesterId);

        if (appUserRepository.findByEmail(request.email()).isPresent()) {
            throw new ConflictException("An account with this email already exists in another organization");
        }
        if (organizationInvitationRepository.existsByOrganizationIdAndEmailAndStatus(
                requester.getOrganization().getId(), request.email(), InvitationStatus.PENDING)) {
            throw new ConflictException("There is already a pending invitation for this email");
        }

        OrganizationInvitation invitation = new OrganizationInvitation(
                requester.getOrganization(), request.email(), requester,
                request.canCreateProjects(), request.canManageMembers(),
                TokenGenerator.generate(), Instant.now().plus(7, ChronoUnit.DAYS)
        );
        invitation = organizationInvitationRepository.save(invitation);

        // stand-in for actually emailing the invite link until a real
        // provider is wired up - same pattern as ProjectInvitation/password
        // reset tokens, never returned via the API response.
        log.info("Organization invitation created for {} to org {}: token={}",
                request.email(), requester.getOrganization().getId(), invitation.getToken());

        return toInvitationResponse(invitation);
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrganizationInvitationResponse> listInvitations(UUID requesterId) {
        AppUser requester = requireAdmin(requesterId);
        return organizationInvitationRepository
                .findByOrganizationIdAndStatus(requester.getOrganization().getId(), InvitationStatus.PENDING)
                .stream()
                .map(this::toInvitationResponse)
                .toList();
    }

    @Override
    @Transactional
    public void revokeInvitation(UUID invitationId, UUID requesterId) {
        AppUser requester = requireAdmin(requesterId);
        OrganizationInvitation invitation = organizationInvitationRepository.findById(invitationId)
                .orElseThrow(() -> new ResourceNotFoundException("OrganizationInvitation", invitationId));
        if (!invitation.getOrganization().getId().equals(requester.getOrganization().getId())) {
            throw new ResourceNotFoundException("OrganizationInvitation", invitationId);
        }
        invitation.setStatus(InvitationStatus.REVOKED);
    }

    @Override
    @Transactional
    public void deleteMember(UUID targetUserId, UUID requesterId) {
        AppUser requester = requireAdmin(requesterId);
        AppUser target = getSameOrgUser(requester, targetUserId);

        if (target.isOwner()) {
            throw new ForbiddenException("The organization owner can't be deleted");
        }
        if (target.getId().equals(requesterId)) {
            throw new ForbiddenException("You can't delete your own account");
        }

        projectMemberRepository.deleteAll(projectMemberRepository.findByUserId(target.getId()));
        target.softDelete();
        // in case a token was issued in the instant before this - belt and
        // braces alongside deletedAt on top of assertCurrentTokenVersion.
        target.bumpTokenVersion();

        log.info("Org member {} (id={}) deleted by {}", target.getEmail(), target.getId(), requesterId);
    }

    // owner or a delegated admin (canManageMembers) - the shared gate for
    // every org-membership-management action except granting the admin bit
    // itself, which stays owner-only (see setMemberManagementAccess).
    private AppUser requireAdmin(UUID requesterId) {
        AppUser requester = getUser(requesterId);
        if (!requester.isOwner() && !requester.isCanManageMembers()) {
            throw new ForbiddenException("You don't have permission to manage this organization's members");
        }
        return requester;
    }

    private AppUser getSameOrgUser(AppUser requester, UUID targetUserId) {
        AppUser target = getUser(targetUserId);
        if (!target.getOrganization().getId().equals(requester.getOrganization().getId())) {
            // 404, not 403 - don't confirm to the caller that a user id
            // from a different org even exists.
            throw new ResourceNotFoundException("AppUser", targetUserId);
        }
        return target;
    }

    private AppUser getUser(UUID id) {
        return appUserRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AppUser", id));
    }

    private OrganizationMemberResponse toMemberResponse(AppUser user) {
        return new OrganizationMemberResponse(
                user.getId(), user.getName(), user.getEmail(),
                user.isOwner(), user.isCanCreateProjects(), user.isCanManageMembers(),
                user.getCreatedAt()
        );
    }

    private OrganizationInvitationResponse toInvitationResponse(OrganizationInvitation invitation) {
        return new OrganizationInvitationResponse(
                invitation.getId(),
                invitation.getOrganization().getId(),
                invitation.getEmail(),
                invitation.getInvitedBy().getId(),
                invitation.isCanCreateProjects(),
                invitation.isCanManageMembers(),
                invitation.getStatus().name(),
                invitation.getExpiresAt(),
                invitation.getCreatedAt()
        );
    }
}
