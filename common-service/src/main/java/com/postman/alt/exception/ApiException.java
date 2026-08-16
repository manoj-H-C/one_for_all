package com.postman.alt.exception;

/**
 * Base class for exceptions that should be translated into an HTTP error
 * response by the api module's global exception handler.
 */
public class ApiException extends RuntimeException {

    private final int statusCode;

    public ApiException(String message, int statusCode) {
        super(message);
        this.statusCode = statusCode;
    }

    public int getStatusCode() {
        return statusCode;
    }
}
