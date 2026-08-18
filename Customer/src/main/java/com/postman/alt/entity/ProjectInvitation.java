package com.postman.alt.entity;

import com.postman.alt.enums.InvitationStatus;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Invites someone by email who may not have an app_user account yet - this
 * is structurally different from project_member, which requires an existing
 * user id. Accepting the invite (via `token`) is what creates the
 * project_member row, at which point this row's status flips to ACCEPTED.
 */
@Entity
@Table(
        name = "project_invitation",
        uniqueConstraints = @UniqueConstraint(name = "uk_invitation_token", columnNames = "token")
)
public class ProjectInvitation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false)
    private String email;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "role_id", nullable = false)
    private ProjectRole role;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "invited_by", nullable = false)
    private AppUser invitedBy;

    // opaque random token, put in the invite link/email - looked up on
    // accept, never guessable. Generate with a secure random generator in
    // the service layer, not here.
    @Column(nullable = false, length = 255)
    private String token;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InvitationStatus status;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected ProjectInvitation() {
        // JPA
    }

    public ProjectInvitation(Project project, String email, ProjectRole role, AppUser invitedBy,
                             String token, Instant expiresAt) {
        this.project = project;
        this.email = email;
        this.role = role;
        this.invitedBy = invitedBy;
        this.token = token;
        this.expiresAt = expiresAt;
        this.status = InvitationStatus.PENDING;
    }

    public UUID getId() {
        return id;
    }

    public Project getProject() {
        return project;
    }

    public String getEmail() {
        return email;
    }

    public ProjectRole getRole() {
        return role;
    }

    public void setRole(ProjectRole role) {
        this.role = role;
    }

    public AppUser getInvitedBy() {
        return invitedBy;
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

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}