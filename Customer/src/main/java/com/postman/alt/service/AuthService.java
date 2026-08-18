package com.postman.alt.service;

import com.postman.alt.service.dto.AuthResponse;
import com.postman.alt.service.dto.ForgotPasswordRequest;
import com.postman.alt.service.dto.LoginRequest;
import com.postman.alt.service.dto.RefreshRequest;
import com.postman.alt.service.dto.RegisterRequest;
import com.postman.alt.service.dto.ResetPasswordRequest;
import com.postman.alt.service.dto.UserResponse;
import com.postman.alt.service.dto.VerifyEmailRequest;

import java.util.UUID;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    // trades a valid, unexpired refresh token for a new access token (and a
    // new refresh token - not rotated/single-use, since that needs a store
    // of spent tokens to detect reuse, which this deliberately doesn't have).
    AuthResponse refresh(RefreshRequest request);

    UserResponse me(UUID userId);

    /**
     * Re-checks that userId still corresponds to a real AppUser row. Called
     * by JwtAuthenticationFilter on every request so a token survives only
     * as long as the account it was issued for still exists - a valid
     * signature alone isn't enough. Throws UnauthorizedException if not.
     */
    UserResponse loadActiveUser(UUID userId);

    /**
     * Rejects the request unless tokenVersion still matches the account's
     * current AppUser.tokenVersion - i.e. no password reset (or other
     * future revocation trigger) has happened since this token was issued.
     * Called by JwtAuthenticationFilter alongside loadActiveUser. Throws
     * UnauthorizedException if the account is gone or the version is stale.
     */
    void assertCurrentTokenVersion(UUID userId, int tokenVersion);

    // always succeeds regardless of whether the email exists, so the caller
    // can't use this endpoint to enumerate registered accounts.
    void forgotPassword(ForgotPasswordRequest request);

    // also bumps the account's tokenVersion, invalidating every token
    // (access and refresh) issued before the reset.
    void resetPassword(ResetPasswordRequest request);

    void verifyEmail(VerifyEmailRequest request);

    void resendVerification(UUID userId);
}
