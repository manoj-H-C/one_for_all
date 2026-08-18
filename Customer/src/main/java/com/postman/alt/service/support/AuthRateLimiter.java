package com.postman.alt.service.support;

import com.postman.alt.exception.TooManyRequestsException;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory brute-force guard for login and forgot-password. Single-instance
 * only (state lives in a local map, not shared across nodes) and never
 * evicted - fine for a single-node deployment, but move to a shared store
 * (e.g. Redis) before running more than one instance behind a load balancer.
 */
@Component
public class AuthRateLimiter {

    private static final int MAX_LOGIN_FAILURES = 5;
    private static final Duration LOGIN_LOCKOUT = Duration.ofMinutes(15);
    private static final Duration PASSWORD_RESET_COOLDOWN = Duration.ofSeconds(60);

    private final ConcurrentHashMap<String, LoginState> loginAttempts = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Instant> lastPasswordResetRequest = new ConcurrentHashMap<>();

    private record LoginState(int failures, Instant lockedUntil) {
    }

    public void assertLoginAllowed(String email) {
        LoginState state = loginAttempts.get(normalize(email));
        if (state != null && state.lockedUntil() != null && state.lockedUntil().isAfter(Instant.now())) {
            throw new TooManyRequestsException("Too many failed login attempts. Try again in a few minutes.");
        }
    }

    public void recordLoginFailure(String email) {
        loginAttempts.compute(normalize(email), (key, current) -> {
            int failures = (current == null ? 0 : current.failures()) + 1;
            Instant lockedUntil = failures >= MAX_LOGIN_FAILURES ? Instant.now().plus(LOGIN_LOCKOUT) : null;
            return new LoginState(failures, lockedUntil);
        });
    }

    public void recordLoginSuccess(String email) {
        loginAttempts.remove(normalize(email));
    }

    // called before we even know whether the email has an account, so this
    // also caps how fast an attacker can probe for registered emails via
    // forgot-password's (deliberately) silent success/failure.
    public void assertPasswordResetAllowed(String email) {
        String key = normalize(email);
        Instant last = lastPasswordResetRequest.get(key);
        if (last != null && last.plus(PASSWORD_RESET_COOLDOWN).isAfter(Instant.now())) {
            throw new TooManyRequestsException("Please wait a bit before requesting another reset link.");
        }
        lastPasswordResetRequest.put(key, Instant.now());
    }

    private String normalize(String email) {
        return email.trim().toLowerCase();
    }
}
