package com.postman.alt.exception;

public class TooManyRequestsException extends ApiException {

    public TooManyRequestsException(String message) {
        super(message, 429);
    }
}
