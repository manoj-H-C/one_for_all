package com.postman.alt.dto;

import java.time.Instant;

/**
 * The one response shape every endpoint in the platform uses, success or
 * error alike - applied automatically (see ResponseBodyAdvice in app) so
 * individual controllers never construct this themselves.
 */
public record ApiResponse<T>(
        boolean success,
        int status,
        String message,
        T data,
        Instant timestamp
) {
    public static <T> ApiResponse<T> ok(int status, T data) {
        return new ApiResponse<>(true, status, "OK", data, Instant.now());
    }

    public static ApiResponse<Void> error(int status, String message) {
        return new ApiResponse<>(false, status, message, null, Instant.now());
    }
}
