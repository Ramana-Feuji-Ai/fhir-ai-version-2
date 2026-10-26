package com.fhi.fhirlearning.service;

import org.springframework.http.HttpStatus;

import com.fasterxml.jackson.databind.JsonNode;

/** Carries a FHIR OperationOutcome body alongside the HTTP status the sandbox controller should return. */
public class SandboxOperationException extends RuntimeException {
    private final HttpStatus status;
    private final JsonNode outcome;

    public SandboxOperationException(HttpStatus status, JsonNode outcome) {
        super(outcome.toString());
        this.status = status;
        this.outcome = outcome;
    }

    public HttpStatus getStatus() { return status; }
    public JsonNode getOutcome() { return outcome; }
}
