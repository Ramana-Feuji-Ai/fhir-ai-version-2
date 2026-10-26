package com.fhi.fhirlearning.web.dto;

import java.util.List;

import jakarta.validation.constraints.NotBlank;

/** PRD 8.3 FHIR Design and Development Assistant (FR-011..FR-016). */
public final class DesignDtos {
    private DesignDtos() {}

    public record RecommendResourcesRequest(
            String persona, String fhirVersion, String implementationGuide, @NotBlank String workflow
    ) {}

    public record RecommendResourcesResponse(String answer) {}

    public record GeneratePayloadRequest(
            String fhirVersion, String implementationGuide, @NotBlank String artifact, String intent
    ) {}

    /** {@code issues} comes from the same deterministic validator the sandbox uses, so the draft is checked, not just generated. */
    public record GeneratePayloadResponse(String json, boolean valid, List<String> issues) {}

    public record GenerateApiRequest(
            @NotBlank String resource, @NotBlank String interaction, String requirement, String fhirVersion
    ) {}

    public record GenerateApiResponse(String request, String explanation) {}

    public record ExplainIgRequest(
            String persona, String fhirVersion, String implementationGuide, String resourceType, @NotBlank String question
    ) {}

    public record ExplainIgResponse(String answer, List<String> checklist) {}
}
