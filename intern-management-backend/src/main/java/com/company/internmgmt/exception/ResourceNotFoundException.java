package com.company.internmgmt.exception;

/**
 * Thrown by services when a referenced entity (batch/intern) doesn't exist;
 * GlobalExceptionHandler turns it into a 404 response.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
