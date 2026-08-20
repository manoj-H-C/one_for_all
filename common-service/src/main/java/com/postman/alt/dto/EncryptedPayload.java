package com.postman.alt.dto;

/**
 * The wire shape for both encrypted requests and encrypted responses: the
 * real JSON body (a request DTO, or an ApiResponse envelope) is encrypted
 * as a whole and carried as a single base64 string here, so content-type
 * stays application/json either way.
 */
public record EncryptedPayload(String data) {
}
