package com.postman.alt.entity;

import com.postman.alt.enums.InvitationStatus;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Invites someone by email to join an ORGANIZATION, not a project - the
 * piece that lets an org grow past its single self-registered owner.
 * Accepting (via `token`) creates a brand-new AppUser under this invitation's
 * organization, rather than the self-serve /api/auth/register path (which
 * always creates a fresh org). Structurally parallel to ProjectInvitation,
 * one level up.
 */
@Entity
@Table(
        name = "organization_invitation",
        uniqueConstraints = @UniqueConstraint(name = "uk_org_invitation_token", columnNames = "token")
)
public class OrganizationInvitation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "org_id", nullable = false)
    private Organization organization;

    @Column(nullable = false)
    private String email;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "invited_by", nullable = false)
    private AppUser invitedBy;

    // the access level the new account starts with once they accept -
    // decided up front by whoever sent the invite, adjustable afterward via
    // OrganizationServiceImpl.setProjectCreationAccess/setMemberManagementAccess.
    @Column(name = "can_create_projects", nullable = false)
    private boolean canCreateProjects;

    @Column(name = "can_manage_members", nullable = false)
    private boolean canManageMembers;

    @Column(nullable = false, length = 255)
    private String token;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InvitationStatus status;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected OrganizationInvitation() {
        // JPA
    }

    public OrganizationInvitation(
            Organization organization, String email, AppUser invitedBy,
            boolean canCreateProjects, boolean canManageMembers,
            String token, Instant expiresAt
    ) {
        this.organization = organization;
        this.email = email;
        this.invitedBy = invitedBy;
        this.canCreateProjects = canCreateProjects;
        this.canManageMembers = canManageMembers;
        this.token = token;
        this.expiresAt = expiresAt;
        this.status = InvitationStatus.PENDING;
    }

    public UUID getId() {
        return id;
    }

    public Organization getOrganization() {
        return organization;
    }

    public String getEmail() {
        return email;
    }

    public AppUser getInvitedBy() {
        return invitedBy;
    }

    public boolean isCanCreateProjects() {
        return canCreateProjects;
    }

    public boolean isCanManageMembers() {
        return canManageMembers;
    }

    public String getToken() {
        return token;
    }

    public InvitationStatus getStatus() {
        return status;
    }

    public void setStatus(InvitationStatus status) {
        this.status = status;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
