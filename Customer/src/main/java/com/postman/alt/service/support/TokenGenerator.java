package com.postman.alt.service.support;

import java.security.SecureRandom;
import java.util.Base64;

/**
 * Opaque, unguessable tokens for the token+expiry+purpose shape shared by
 * ProjectInvitation and UserToken (password reset / email verification).
 */
public final class TokenGenerator {

    private static final SecureRandom RANDOM = new SecureRandom();

    // excludes visually-confusable characters (0/O, 1/l/I) since this one is
    // meant to be read and typed by a person, unlike generate()'s tokens.
    private static final String TEMP_PASSWORD_ALPHABET =
            "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
    private static final int TEMP_PASSWORD_LENGTH = 12;

    private TokenGenerator() {
    }

    public static String generate() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    // for directly-created org members (OrganizationServiceImpl.createMember) -
    // a short, human-typeable secret the admin relays out-of-band, distinct
    // from generate()'s long opaque tokens used for links.
    public static String generateTemporaryPassword() {
        StringBuilder password = new StringBuilder(TEMP_PASSWORD_LENGTH);
        for (int i = 0; i < TEMP_PASSWORD_LENGTH; i++) {
            password.append(TEMP_PASSWORD_ALPHABET.charAt(RANDOM.nextInt(TEMP_PASSWORD_ALPHABET.length())));
        }
        return password.toString();
    }
}
