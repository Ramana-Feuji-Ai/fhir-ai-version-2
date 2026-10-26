package com.fhi.fhirlearning.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;

/**
 * Lightweight structural validator for the FHIR sandbox: checks resourceType, id format, a small
 * set of required fields per resource type, and a few status-code enumerations. This is a
 * simplified stand-in for real profile/implementation-guide validation (e.g. HAPI FHIR + US Core),
 * scoped to give learners explainable errors without pulling in a full FHIR validation engine.
 */
@Service
public class SandboxValidationService {

    public record ValidationIssue(String severity, String code, String expression, String diagnostics) {}

    /** Each inner list is a set of alternative field names; at least one must be present and non-empty. */
    private static final Map<String, List<List<String>>> REQUIRED_FIELDS = Map.of(
            "Patient", List.of(List.of("identifier"), List.of("name"), List.of("gender")),
            "Practitioner", List.of(List.of("identifier"), List.of("name")),
            "Organization", List.of(List.of("name")),
            "Encounter", List.of(List.of("status"), List.of("class"), List.of("subject")),
            "Observation", List.of(List.of("status"), List.of("code"), List.of("subject")),
            "Condition", List.of(List.of("subject"), List.of("code")),
            "MedicationRequest", List.of(List.of("status"), List.of("intent"), List.of("subject"),
                    List.of("medicationCodeableConcept", "medicationReference")),
            "Coverage", List.of(List.of("status"), List.of("beneficiary"), List.of("payor")),
            "Claim", List.of(List.of("status"), List.of("type"), List.of("patient"), List.of("provider"))
    );

    private static final Map<String, Set<String>> STATUS_ENUMS = Map.of(
            "Encounter", Set.of("planned", "arrived", "triaged", "in-progress", "onleave", "finished", "cancelled", "entered-in-error", "unknown"),
            "Observation", Set.of("registered", "preliminary", "final", "amended", "corrected", "cancelled", "entered-in-error", "unknown"),
            "MedicationRequest", Set.of("active", "on-hold", "cancelled", "completed", "entered-in-error", "stopped", "draft", "unknown"),
            "Coverage", Set.of("active", "cancelled", "draft", "entered-in-error"),
            "Claim", Set.of("active", "cancelled", "draft", "entered-in-error")
    );

    public List<ValidationIssue> validate(String resourceType, JsonNode resource) {
        List<ValidationIssue> issues = new ArrayList<>();

        JsonNode declaredType = resource.get("resourceType");
        if (declaredType == null || declaredType.asText().isBlank()) {
            issues.add(new ValidationIssue("error", "required", resourceType, "resourceType is required"));
        } else if (!resourceType.equals(declaredType.asText())) {
            issues.add(new ValidationIssue("error", "invalid", resourceType,
                    "resourceType '" + declaredType.asText() + "' does not match endpoint '" + resourceType + "'"));
        }

        JsonNode idNode = resource.get("id");
        if (idNode != null && !idNode.isNull() && !idNode.asText().matches("[A-Za-z0-9\\-.]{1,64}")) {
            issues.add(new ValidationIssue("error", "value", resourceType + ".id",
                    "id must match [A-Za-z0-9\\-.]{1,64} (got '" + idNode.asText() + "')"));
        }

        for (List<String> alternatives : REQUIRED_FIELDS.getOrDefault(resourceType, List.of())) {
            boolean present = alternatives.stream().anyMatch(field -> isPresent(resource.get(field)));
            if (!present) {
                String field = String.join(" or ", alternatives);
                issues.add(new ValidationIssue("error", "required", resourceType + "." + alternatives.get(0),
                        field + " is required on " + resourceType));
            }
        }

        Set<String> allowedStatus = STATUS_ENUMS.get(resourceType);
        JsonNode statusNode = resource.get("status");
        if (allowedStatus != null && statusNode != null && statusNode.isTextual() && !allowedStatus.contains(statusNode.asText())) {
            issues.add(new ValidationIssue("error", "code-invalid", resourceType + ".status",
                    "status '" + statusNode.asText() + "' is not one of " + allowedStatus));
        }

        return issues;
    }

    public boolean isSupportedResourceType(String resourceType) {
        return REQUIRED_FIELDS.containsKey(resourceType);
    }

    public List<String> supportedResourceTypes() {
        return REQUIRED_FIELDS.keySet().stream().sorted().toList();
    }

    /**
     * Plain-language summary of the sandbox's configured rules for a resource type -- required
     * fields and any status enumeration -- used to ground AI-generated payloads, IG explanations,
     * and test cases in the same rules the sandbox actually enforces (PRD 8.3/8.4) instead of
     * whatever the model assumes about the resource.
     */
    public String describeRules(String resourceType) {
        List<List<String>> required = REQUIRED_FIELDS.get(resourceType);
        if (required == null) return "No configured rules for resource type '" + resourceType + "' in this sandbox.";
        StringBuilder sb = new StringBuilder("Required fields on " + resourceType + ": ");
        sb.append(required.stream().map(alts -> String.join(" or ", alts)).reduce((a, b) -> a + "; " + b).orElse("(none)"));
        Set<String> allowedStatus = STATUS_ENUMS.get(resourceType);
        if (allowedStatus != null) {
            sb.append(". Allowed status codes: ").append(allowedStatus);
        }
        return sb.toString();
    }

    private static boolean isPresent(JsonNode node) {
        if (node == null || node.isNull()) return false;
        if (node.isArray()) return node.size() > 0;
        if (node.isTextual()) return !node.asText().isBlank();
        return true;
    }
}
