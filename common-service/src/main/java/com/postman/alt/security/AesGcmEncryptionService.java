package com.postman.alt.security;

import com.postman.alt.exception.BadRequestException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * AES-256-GCM for the request/response body encryption layer. GCM is an
 * AEAD cipher - it gives confidentiality AND integrity/authenticity in one
 * primitive, unlike CBC (which needs a separate MAC and is vulnerable to
 * padding-oracle and bit-flipping attacks without one). A fresh random
 * 96-bit nonce is generated per call and prepended to the ciphertext -
 * reusing a nonce/IV under the same key (as plain CBC with a fixed IV does)
 * breaks GCM's security guarantees just as badly, so this is non-negotiable.
 */
@Component
public class AesGcmEncryptionService {

    private static final String TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int NONCE_LENGTH_BYTES = 12;
    private static final int TAG_LENGTH_BITS = 128;

    private final SecureRandom secureRandom = new SecureRandom();
    private final SecretKeySpec key;

    public AesGcmEncryptionService(@Value("${app.encryption.key}") String base64Key) {
        byte[] keyBytes = Base64.getDecoder().decode(base64Key);
        if (keyBytes.length != 16 && keyBytes.length != 24 && keyBytes.length != 32) {
            throw new IllegalStateException(
                    "app.encryption.key must decode to 16, 24, or 32 bytes (AES-128/192/256); got " + keyBytes.length
            );
        }
        this.key = new SecretKeySpec(keyBytes, "AES");
    }

    public String encrypt(String plaintext) {
        try {
            byte[] nonce = new byte[NONCE_LENGTH_BYTES];
            secureRandom.nextBytes(nonce);

            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.ENCRYPT_MODE, key, new GCMParameterSpec(TAG_LENGTH_BITS, nonce));
            byte[] ciphertext = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

            // nonce is not secret - prepending it is the standard way to carry
            // it alongside the ciphertext without a separate out-of-band field.
            ByteBuffer combined = ByteBuffer.allocate(nonce.length + ciphertext.length);
            combined.put(nonce).put(ciphertext);
            return Base64.getEncoder().encodeToString(combined.array());
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("Encryption failed", e);
        }
    }

    public String decrypt(String encoded) {
        try {
            byte[] combined = Base64.getDecoder().decode(encoded);
            if (combined.length <= NONCE_LENGTH_BYTES) {
                throw new BadRequestException("Malformed encrypted payload");
            }

            ByteBuffer buffer = ByteBuffer.wrap(combined);
            byte[] nonce = new byte[NONCE_LENGTH_BYTES];
            buffer.get(nonce);
            byte[] ciphertext = new byte[buffer.remaining()];
            buffer.get(ciphertext);

            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(TAG_LENGTH_BITS, nonce));
            byte[] plaintext = cipher.doFinal(ciphertext);
            return new String(plaintext, StandardCharsets.UTF_8);
        } catch (BadRequestException e) {
            throw e;
        } catch (IllegalArgumentException | GeneralSecurityException e) {
            // wrong key, corrupted ciphertext, or a tampered auth tag all land
            // here - GCM deliberately doesn't distinguish "tampered" from
            // "malformed" in a way that's safe to expose to the caller.
            throw new BadRequestException("Malformed encrypted payload");
        }
    }
}
