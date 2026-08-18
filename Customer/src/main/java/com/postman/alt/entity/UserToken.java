package com.postman.alt.entity;

import com.postman.alt.enums.TokenPurpose;
import jakarta.persistence.*;

import java.time.Instant;
import java.util.UUID;

/**
 * Opaque, single-use token proving control of an AppUser's email, used for
 * both "forgot password" and "verify your email" - same token+expiry shape
 * as ProjectInvitation, distinguished here by `purpose` instead of a
 * separate table per flow.
 */
@Entity
@Table(
        name = "user_token",
        uniqueConstraints = @UniqueConstraint(name = "uk_user_token_token", columnNames = "token")
)
public class UserToken {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    // opaque random token, put in the reset/verification link - looked up on
    // use, never guessable. Generate with a secure random generator in the
    // service layer, not here.
    @Column(nullable = false, length = 255)
    private String token;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TokenPurpose purpose;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    // null = not yet used. Tokens are single-use, so a non-null usedAt means
    // this token must be rejected even if it hasn't expired.
    @Column(name = "used_at")
    private Instant usedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected UserToken() {
        // JPA
    }

    public UserToken(AppUser user, String token, TokenPurpose purpose, Instant expiresAt) {
        this.user = user;
        this.token = token;
        this.purpose = purpose;
        this.expiresAt = expiresAt;
    }

    public UUID getId() {
        return id;
    }

    public AppUser getUser() {
        return user;
    }

    public String getToken() {
        return token;
    }

    public TokenPurpose getPurpose() {
        return purpose;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public Instant getUsedAt() {
        return usedAt;
    }

    public void markUsed() {
        this.usedAt = Instant.now();
    }

    public boolean isUsed() {
        return usedAt != null;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
