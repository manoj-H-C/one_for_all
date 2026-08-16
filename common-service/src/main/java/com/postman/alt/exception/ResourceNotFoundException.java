package com.postman.alt.exception;

public class ResourceNotFoundException extends ApiException {

    public ResourceNotFoundException(String resource, Object id) {
        super(resource + " not found with id: " + id, 404);
    }

    public ResourceNotFoundException(String message) {
        super(message, 404);
    }
}
