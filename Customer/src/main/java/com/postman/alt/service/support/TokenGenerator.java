package com.postman.alt.service.support;

import java.security.SecureRandom;
import java.util.Base64;

/**
 * Opaque, unguessable tokens for the token+expiry+purpose shape shared by
 * ProjectInvitation and UserToken (password reset / email verification).
 */
public final class TokenGenerator {

    private static final SecureRandom RANDOM = new SecureRandom();

    private TokenGenerator() {
    }

    public static String generate() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
