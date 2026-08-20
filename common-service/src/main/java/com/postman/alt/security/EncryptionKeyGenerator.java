package com.postman.alt.security;

import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;

/**
 * Run this once to produce a new value for app.encryption.key / the
 * ENCRYPTION_KEY env var - it's never invoked by the running application.
 * Deliberately does not seed SecureRandom with anything: an unseeded
 * SecureRandom pulling from the JDK's own entropy source is what makes the
 * key unpredictable in the first place, so seeding it with a fixed string
 * (as some reference implementations do) would defeat the point.
 */
public final class EncryptionKeyGenerator {

    private EncryptionKeyGenerator() {
    }

    public static void main(String[] args) throws NoSuchAlgorithmException {
        KeyGenerator keyGenerator = KeyGenerator.getInstance("AES");
        keyGenerator.init(256);
        SecretKey key = keyGenerator.generateKey();
        System.out.println(Base64.getEncoder().encodeToString(key.getEncoded()));
    }
}
