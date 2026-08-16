package com.postman.alt.dto;

import java.time.Instant;

/**
 * Standard error body returned by every controller in the platform.
 * Keeping this in `common` means api, domain and persistence all agree
 * on one error shape, regardless of which module throws.
 */
public record ErrorResponse(
        Instant timestamp,
        int status,
        String error,
        String message,
        String path
) {
    public static ErrorResponse of(int status, String error, String message, String path) {
        return new ErrorResponse(Instant.now(), status, error, message, path);
    }
}
