package com.postman.alt.exception;

public class ConflictException extends ApiException {

    public ConflictException(String message) {
        super(message, 409);
    }
}
