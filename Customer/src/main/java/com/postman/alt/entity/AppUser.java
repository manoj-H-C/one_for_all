package com.postman.alt.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "app_user", uniqueConstraints = @UniqueConstraint(columnNames = {"org_id", "email"}))
public class AppUser {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "org_id", nullable = false)
    private Organization organization;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String name;

    // Store a hash only - never the raw password. Actual hashing (BCrypt/Argon2)
    // happens in the api module's auth service.
    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    // org-level root account - bypasses project_role_permission entirely.
    // See ProjectAccessService.hasPermission for the enforcement logic.
    @Column(name = "is_owner", nullable = false)
    private boolean owner = false;

    // narrower than `owner` - lets the owner delegate just "can create
    // projects" to a trusted member, without handing them the owner's full
    // bypass of every permission check on every project (see
    // ProjectAccessServiceImpl.requirePermission). Owners can always create
    // projects regardless of this flag - see ProjectServiceImpl.create.
    @Column(name = "can_create_projects", nullable = false)
    private boolean canCreateProjects = false;

    // the org's delegated "admin" bit: can invite new users into the org and
    // grant/revoke canCreateProjects on other members. Deliberately can't
    // grant this flag itself to anyone else - only the owner mints admins,
    // so privilege can't chain outward uncontrolled. See
    // OrganizationServiceImpl.setMemberManagementAccess.
    @Column(name = "can_manage_members", nullable = false)
    private boolean canManageMembers = false;

    @Column(name = "email_verified", nullable = false)
    private boolean emailVerified = false;

    // set when an admin creates this account directly with a system-generated
    // temporary password (see OrganizationServiceImpl.createMember) - forces
    // AuthServiceImpl.changePassword before JwtAuthenticationFilter will let
    // any other authenticated endpoint through. Never set for self-registered
    // or invitation-accepted accounts, since those already chose their own
    // password.
    @Column(name = "must_reset_password", nullable = false)
    private boolean mustResetPassword = false;

    // embedded as a claim in every issued JWT - bumping this invalidates
    // every token issued before the bump (see AuthServiceImpl.resetPassword),
    // without needing a token table to check on every request.
    @Column(name = "token_version", nullable = false)
    private int tokenVersion = 0;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    // null = active. Deleting a user from the org admin page sets this
    // instead of removing the row, so their name still resolves correctly
    // on old comments/assignments/activity - but they lose every project
    // membership (see OrganizationServiceImpl.deleteMember), can't log in
    // (AuthServiceImpl.login), and any still-active token is rejected on
    // the very next request (AuthServiceImpl.assertCurrentTokenVersion).
    @Column(name = "deleted_at")
    private Instant deletedAt;

    protected AppUser() {
        // JPA
    }

    public AppUser(Organization organization, String email, String name, String passwordHash) {
        this.organization = organization;
        this.email = email;
        this.name = name;
        this.passwordHash = passwordHash;
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

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public boolean isOwner() {
        return owner;
    }

    public void setOwner(boolean owner) {
        this.owner = owner;
    }

    public boolean isCanCreateProjects() {
        return canCreateProjects;
    }

    public void setCanCreateProjects(boolean canCreateProjects) {
        this.canCreateProjects = canCreateProjects;
    }

    public boolean isCanManageMembers() {
        return canManageMembers;
    }

    public void setCanManageMembers(boolean canManageMembers) {
        this.canManageMembers = canManageMembers;
    }

    public boolean isEmailVerified() {
        return emailVerified;
    }

    public void setEmailVerified(boolean emailVerified) {
        this.emailVerified = emailVerified;
    }

    public boolean isMustResetPassword() {
        return mustResetPassword;
    }

    public void setMustResetPassword(boolean mustResetPassword) {
        this.mustResetPassword = mustResetPassword;
    }

    public int getTokenVersion() {
        return tokenVersion;
    }

    public void bumpTokenVersion() {
        this.tokenVersion++;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getDeletedAt() {
        return deletedAt;
    }

    public void softDelete() {
        this.deletedAt = Instant.now();
    }
}
