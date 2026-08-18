package com.postman.alt.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.Date;
import java.util.UUID;

/**
 * Issues and validates the platform's JWTs. Shared between Customer's
 * AuthService (issues tokens) and app's JwtAuthenticationFilter (validates
 * them on every request), so this lives in common-service rather than
 * either of those modules.
 *
 * Two token types, distinguished by the "type" claim so one can't be used
 * in place of the other: short-lived access tokens (sent as
 * Authorization: Bearer on every request) and long-lived refresh tokens
 * (sent only to POST /api/auth/refresh to mint a new access token). Both
 * carry the caller's tokenVersion - see AppUser.tokenVersion - so bumping
 * that column invalidates every outstanding token of either kind at once,
 * without a token table to check on every request.
 */
@Component
public class JwtService {

    public static final String TYPE_ACCESS = "access";
    public static final String TYPE_REFRESH = "refresh";

    private final SecretKey key;
    private final long accessTokenMinutes;
    private final long refreshTokenDays;

    public JwtService(
            // base64-encoded, same convention as app.encryption.key - generate
            // either with EncryptionKeyGenerator or `openssl rand -base64 32`.
            @Value("${jwt.secret}") String base64Secret,
            @Value("${jwt.access-token-expiration-minutes:15}") long accessTokenMinutes,
            @Value("${jwt.refresh-token-expiration-days:30}") long refreshTokenDays
    ) {
        this.key = Keys.hmacShaKeyFor(Base64.getDecoder().decode(base64Secret));
        this.accessTokenMinutes = accessTokenMinutes;
        this.refreshTokenDays = refreshTokenDays;
    }

    public String issueAccessToken(UUID userId, UUID orgId, String email, int tokenVersion) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(userId.toString())
                .claim("type", TYPE_ACCESS)
                .claim("tokenVersion", tokenVersion)
                .claim("orgId", orgId.toString())
                .claim("email", email)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(accessTokenMinutes, ChronoUnit.MINUTES)))
                .signWith(key)
                .compact();
    }

    public String issueRefreshToken(UUID userId, int tokenVersion) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(userId.toString())
                .claim("type", TYPE_REFRESH)
                .claim("tokenVersion", tokenVersion)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(refreshTokenDays, ChronoUnit.DAYS)))
                .signWith(key)
                .compact();
    }

    /**
     * Parses and validates the token's signature/expiry, returning its claims.
     * Throws JwtException (or a subclass) if the token is invalid/expired.
     */
    public Claims parseClaims(String token) throws JwtException {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public UUID extractUserId(Claims claims) {
        return UUID.fromString(claims.getSubject());
    }

    public int extractTokenVersion(Claims claims) {
        return claims.get("tokenVersion", Integer.class);
    }

    public String extractType(Claims claims) {
        return claims.get("type", String.class);
    }
}
