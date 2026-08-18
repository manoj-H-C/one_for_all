package com.postman.alt.exception;

public class UnauthorizedException extends ApiException {

    public UnauthorizedException(String message) {
        super(message, 401);
    }
}
