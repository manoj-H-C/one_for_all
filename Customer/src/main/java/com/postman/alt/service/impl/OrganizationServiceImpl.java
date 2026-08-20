package com.postman.alt.service.impl;

import com.postman.alt.entity.AppUser;
import com.postman.alt.entity.OrganizationInvitation;
import com.postman.alt.enums.InvitationStatus;
import com.postman.alt.exception.BadRequestException;
import com.postman.alt.exception.ConflictException;
import com.postman.alt.exception.ForbiddenException;
import com.postman.alt.exception.ResourceNotFoundException;
import com.postman.alt.repository.AppUserRepository;
import com.postman.alt.repository.OrganizationInvitationRepository;
import com.postman.alt.repository.ProjectMemberRepository;
import com.postman.alt.service.OrganizationService;
import com.postman.alt.service.dto.OrganizationInvitationBulkCreateFailure;
import com.postman.alt.service.dto.OrganizationInvitationBulkCreateRequest;
import com.postman.alt.service.dto.OrganizationInvitationBulkCreateResult;
import com.postman.alt.service.dto.OrganizationInvitationBulkCreateRow;
import com.postman.alt.service.dto.OrganizationInvitationCreateRequest;
import com.postman.alt.service.dto.OrganizationInvitationResponse;
import com.postman.alt.service.dto.OrganizationMemberBulkCreateFailure;
import com.postman.alt.service.dto.OrganizationMemberBulkCreateRequest;
import com.postman.alt.service.dto.OrganizationMemberBulkCreateResult;
import com.postman.alt.service.dto.OrganizationMemberBulkCreateRow;
import com.postman.alt.service.dto.OrganizationMemberCreateRequest;
import com.postman.alt.service.dto.OrganizationMemberCreateResponse;
import com.postman.alt.service.dto.OrganizationMemberResponse;
import com.postman.alt.service.support.TokenGenerator;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
public class OrganizationServiceImpl implements OrganizationService {

    private static final Logger log = LoggerFactory.getLogger(OrganizationServiceImpl.class);

    // a single bulk upload is one HTTP request/transaction processed
    // row-by-row - capped so a huge/malformed file can't tie up a request
    // thread or the DB connection for an unbounded amount of time.
    private static final int MAX_BULK_ROWS = 500;

    private final AppUserRepository appUserRepository;
    private final OrganizationInvitationRepository organizationInvitationRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final PasswordEncoder passwordEncoder;
    private final Validator validator;

    public OrganizationServiceImpl(
            AppUserRepository appUserRepository,
            OrganizationInvitationRepository organizationInvitationRepository,
            ProjectMemberRepository projectMemberRepository,
            PasswordEncoder passwordEncoder,
            Validator validator
    ) {
        this.appUserRepository = appUserRepository;
        this.organizationInvitationRepository = organizationInvitationRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.passwordEncoder = passwordEncoder;
        this.validator = validator;
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
        Optional<AppUser> existingByEmail = appUserRepository.findByEmail(request.email());
        if (existingByEmail.isPresent()) {
            throw new ConflictException(existingAccountMessage(existingByEmail.get(), requester));
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
    public OrganizationMemberBulkCreateResult bulkCreateMembers(UUID requesterId, OrganizationMemberBulkCreateRequest request) {
        AppUser requester = requireAdmin(requesterId);

        List<OrganizationMemberBulkCreateRow> rows = request.rows() != null ? request.rows() : List.of();
        if (rows.size() > MAX_BULK_ROWS) {
            throw new BadRequestException("Too many rows in one upload - max " + MAX_BULK_ROWS);
        }

        List<OrganizationMemberCreateResponse> created = new ArrayList<>();
        List<OrganizationMemberBulkCreateFailure> failed = new ArrayList<>();
        // catches a duplicate email listed twice in the same file, which a
        // DB lookup alone can't - neither row has been saved yet when the
        // second one is checked.
        Set<String> emailsInThisBatch = new HashSet<>();

        for (OrganizationMemberBulkCreateRow row : rows) {
            String name = row.name() == null ? "" : row.name().trim();
            String email = row.email() == null ? "" : row.email().trim().toLowerCase();

            String reason = validateBulkRow(name, email, row.canManageMembers(), requester, emailsInThisBatch);
            if (reason != null) {
                failed.add(new OrganizationMemberBulkCreateFailure(row.rowNumber(), row.name(), row.email(), reason));
                continue;
            }

            emailsInThisBatch.add(email);
            String temporaryPassword = TokenGenerator.generateTemporaryPassword();
            AppUser user = new AppUser(requester.getOrganization(), email, name, passwordEncoder.encode(temporaryPassword));
            user.setCanCreateProjects(row.canCreateProjects());
            user.setCanManageMembers(row.canManageMembers());
            user.setMustResetPassword(true);
            user = appUserRepository.save(user);

            created.add(new OrganizationMemberCreateResponse(
                    user.getId(), user.getName(), user.getEmail(),
                    user.isCanCreateProjects(), user.isCanManageMembers(),
                    temporaryPassword, user.getCreatedAt()
            ));
        }

        log.info("Bulk member upload by {}: {} created, {} failed", requesterId, created.size(), failed.size());
        return new OrganizationMemberBulkCreateResult(created, failed);
    }

    // reuses OrganizationMemberCreateRequest's own @NotBlank/@Email rules
    // (via the injected Validator) so a row is held to exactly the same bar
    // as the single-user "Create a user directly" form, rather than a
    // separately maintained copy of the same rules.
    private String validateBulkRow(String name, String email, boolean wantsManageMembers, AppUser requester, Set<String> emailsInThisBatch) {
        Set<ConstraintViolation<OrganizationMemberCreateRequest>> violations =
                validator.validate(new OrganizationMemberCreateRequest(name, email, false, false));
        if (!violations.isEmpty()) {
            return violations.iterator().next().getMessage();
        }
        // unlike createMember (which doesn't gate this at all - a
        // pre-existing gap in the single-user path), bulk upload is new code
        // that can grant this to many accounts in one shot, so it gets the
        // same owner-only check setMemberManagementAccess already enforces
        // elsewhere.
        if (wantsManageMembers && !requester.isOwner()) {
            return "Only the organization owner can grant member-management access";
        }
        if (emailsInThisBatch.contains(email)) {
            return "Duplicate email in this file";
        }
        Optional<AppUser> existingByEmail = appUserRepository.findByEmail(email);
        if (existingByEmail.isPresent()) {
            return existingAccountMessage(existingByEmail.get(), requester);
        }
        return null;
    }

    @Override
    @Transactional
    public OrganizationInvitationResponse createInvitation(UUID requesterId, OrganizationInvitationCreateRequest request) {
        AppUser requester = requireAdmin(requesterId);

        Optional<AppUser> existingByEmail = appUserRepository.findByEmail(request.email());
        if (existingByEmail.isPresent()) {
            throw new ConflictException(existingAccountMessage(existingByEmail.get(), requester));
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
    @Transactional
    public OrganizationInvitationBulkCreateResult bulkCreateInvitations(UUID requesterId, OrganizationInvitationBulkCreateRequest request) {
        AppUser requester = requireAdmin(requesterId);

        List<OrganizationInvitationBulkCreateRow> rows = request.rows() != null ? request.rows() : List.of();
        if (rows.size() > MAX_BULK_ROWS) {
            throw new BadRequestException("Too many rows in one upload - max " + MAX_BULK_ROWS);
        }

        List<OrganizationInvitationResponse> created = new ArrayList<>();
        List<OrganizationInvitationBulkCreateFailure> failed = new ArrayList<>();
        // same rationale as bulkCreateMembers - catches the same email
        // appearing twice in one file, which the DB checks below can't since
        // neither row has been saved yet when the second is checked.
        Set<String> emailsInThisBatch = new HashSet<>();

        for (OrganizationInvitationBulkCreateRow row : rows) {
            String email = row.email() == null ? "" : row.email().trim().toLowerCase();

            String reason = validateBulkInvitationRow(email, row.canManageMembers(), requester, emailsInThisBatch);
            if (reason != null) {
                failed.add(new OrganizationInvitationBulkCreateFailure(row.rowNumber(), row.email(), reason));
                continue;
            }

            emailsInThisBatch.add(email);
            OrganizationInvitation invitation = new OrganizationInvitation(
                    requester.getOrganization(), email, requester,
                    row.canCreateProjects(), row.canManageMembers(),
                    TokenGenerator.generate(), Instant.now().plus(7, ChronoUnit.DAYS)
            );
            invitation = organizationInvitationRepository.save(invitation);
            log.info("Bulk invitation created for {} to org {}: token={}", email, requester.getOrganization().getId(), invitation.getToken());
            created.add(toInvitationResponse(invitation));
        }

        log.info("Bulk invitation upload by {}: {} created, {} failed", requesterId, created.size(), failed.size());
        return new OrganizationInvitationBulkCreateResult(created, failed);
    }

    // mirrors createInvitation's own checks (same messages, so the bulk and
    // single-row paths read consistently to whoever's using them), plus the
    // same owner-only gate on canManageMembers and intra-batch duplicate
    // check bulkCreateMembers/validateBulkRow uses.
    private String validateBulkInvitationRow(String email, boolean wantsManageMembers, AppUser requester, Set<String> emailsInThisBatch) {
        Set<ConstraintViolation<OrganizationInvitationCreateRequest>> violations =
                validator.validate(new OrganizationInvitationCreateRequest(email, false, false));
        if (!violations.isEmpty()) {
            return violations.iterator().next().getMessage();
        }
        if (wantsManageMembers && !requester.isOwner()) {
            return "Only the organization owner can grant member-management access";
        }
        if (emailsInThisBatch.contains(email)) {
            return "Duplicate email in this file";
        }
        Optional<AppUser> existingByEmail = appUserRepository.findByEmail(email);
        if (existingByEmail.isPresent()) {
            return existingAccountMessage(existingByEmail.get(), requester);
        }
        if (organizationInvitationRepository.existsByOrganizationIdAndEmailAndStatus(
                requester.getOrganization().getId(), email, InvitationStatus.PENDING)) {
            return "There is already a pending invitation for this email";
        }
        return null;
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

    // appUserRepository.findByEmail is a global lookup, not scoped to the
    // requester's own org - the account it finds could be a member right
    // here (e.g. inviting someone by a typo'd email that's actually already
    // one of your own members) or genuinely in a different org, and the
    // message needs to say which instead of always claiming "another
    // organization" regardless.
    private String existingAccountMessage(AppUser existing, AppUser requester) {
        return existing.getOrganization().getId().equals(requester.getOrganization().getId())
                ? "This person is already a member of your organization"
                : "An account with this email already exists in another organization";
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
