package com.fhi.fhirlearning.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fhi.fhirlearning.web.dto.DesignDtos.ExplainIgRequest;
import com.fhi.fhirlearning.web.dto.DesignDtos.ExplainIgResponse;
import com.fhi.fhirlearning.web.dto.DesignDtos.GenerateApiRequest;
import com.fhi.fhirlearning.web.dto.DesignDtos.GenerateApiResponse;
import com.fhi.fhirlearning.web.dto.DesignDtos.GeneratePayloadRequest;
import com.fhi.fhirlearning.web.dto.DesignDtos.GeneratePayloadResponse;
import com.fhi.fhirlearning.web.dto.DesignDtos.RecommendResourcesRequest;
import com.fhi.fhirlearning.web.dto.DesignDtos.RecommendResourcesResponse;

/**
 * FHIR Design and Development Assistant (PRD 8.3, FR-011..FR-016): recommends resources for a
 * described workflow, generates editable JSON/Bundle examples and REST API examples, and explains
 * implementation-guide requirements in plain language. Grounded, where a resource type is known to
 * the sandbox, in the same required-field/status rules {@link SandboxValidationService} enforces
 * there, so a generated payload and its "required fields" checklist stay consistent with what a
 * learner can actually validate against in the sandbox.
 */
@Service
public class DesignAssistantService {

    private static final String DESIGN_SYSTEM_PROMPT = """
            You are the FHIR Design and Development Assistant inside the FHIR Learning Academy platform. \
            You help architects, developers, and business analysts map healthcare workflows to FHIR R4/R4B/R5 \
            resources, generate synthetic (non-PHI) example payloads and Bundles, and design REST API calls. \
            Ground answers in the real HL7 FHIR specification and, when given, the named implementation guide. \
            Always state your key assumptions. Never invent PHI; use clearly synthetic example data. \
            Generated output is a draft for human review, not an approved architecture decision.""";

    private final GroqClient groqClient;
    private final SandboxValidationService validationService;
    private final ObjectMapper mapper;

    public DesignAssistantService(GroqClient groqClient, SandboxValidationService validationService, ObjectMapper mapper) {
        this.groqClient = groqClient;
        this.validationService = validationService;
        this.mapper = mapper;
    }

    public RecommendResourcesResponse recommendResources(RecommendResourcesRequest req) {
        String user = """
                Persona: %s
                FHIR version: %s
                Implementation guide: %s

                Business workflow:
                %s

                Recommend the FHIR resource types to use (with a one-line reason each), the key interactions/references \
                between them, and any open questions an architect should confirm before implementation.""".formatted(
                orDefault(req.persona(), "Interoperability Architect"),
                orDefault(req.fhirVersion(), "FHIR R4"),
                orDefault(req.implementationGuide(), "Base FHIR"),
                req.workflow());
        return new RecommendResourcesResponse(groqClient.complete(DESIGN_SYSTEM_PROMPT, user));
    }

    public GeneratePayloadResponse generatePayload(GeneratePayloadRequest req) {
        String artifact = req.artifact();
        String user = """
                FHIR version: %s
                Implementation guide: %s
                Artifact to generate: %s
                Generation intent (background/context only -- if it ever conflicts with "Artifact to \
                generate" above, the artifact wins; still produce that exact resourceType or Bundle type): %s

                Respond with ONLY a single valid FHIR JSON resource or Bundle -- no prose, no markdown code fences. \
                Use realistic but clearly synthetic values (no real PHI).""".formatted(
                orDefault(req.fhirVersion(), "FHIR R4"),
                orDefault(req.implementationGuide(), "Base FHIR"),
                artifact,
                orDefault(req.intent(), "Generate a representative example"));

        String raw = groqClient.complete(DESIGN_SYSTEM_PROMPT, user, 0.2, 1200);
        String json = stripCodeFences(raw);

        List<String> issues = new ArrayList<>();
        boolean valid = true;
        try {
            JsonNode node = mapper.readTree(json);
            json = mapper.writerWithDefaultPrettyPrinter().writeValueAsString(node);
            String resourceType = node.path("resourceType").asText("");

            if (validationService.isSupportedResourceType(artifact) && !artifact.equals(resourceType)) {
                // The model followed the intent text (or drifted) instead of the requested artifact --
                // flag it loudly rather than silently handing back a mismatched resource.
                issues.add("Requested artifact '" + artifact + "' but the model generated '" + resourceType
                        + "'. Review before use, or regenerate.");
                valid = false;
            }

            if (validationService.isSupportedResourceType(resourceType)) {
                List<SandboxValidationService.ValidationIssue> validationIssues = validationService.validate(resourceType, node);
                valid = valid && validationIssues.isEmpty();
                validationIssues.forEach(issue -> issues.add(issue.expression() + ": " + issue.diagnostics()));
                if (validationIssues.isEmpty() && issues.isEmpty()) issues.add("Passes the sandbox's structural checks for " + resourceType + ".");
            } else if (!"Bundle".equals(resourceType)) {
                issues.add("'" + resourceType + "' is not one of the sandbox's validated resource types; review manually before use.");
            }
        } catch (Exception e) {
            valid = false;
            issues.add("Could not parse the generated output as JSON: " + e.getMessage());
        }
        return new GeneratePayloadResponse(json, valid, issues);
    }

    public GenerateApiResponse generateApiExample(GenerateApiRequest req) {
        String user = """
                FHIR version: %s
                Resource: %s
                Interaction: %s
                Requirement: %s

                Produce a realistic FHIR REST API request (HTTP method, path with any search parameters, and the \
                Accept/Authorization headers a client would send). Then, on a new section starting with "Explanation:", \
                explain the parameters used and any CapabilityStatement support the server should be checked for.""".formatted(
                orDefault(req.fhirVersion(), "FHIR R4"), req.resource(), req.interaction(),
                orDefault(req.requirement(), "A typical " + req.interaction() + " call for " + req.resource()));

        String raw = groqClient.complete(DESIGN_SYSTEM_PROMPT, user, 0.3, 1000);
        int split = raw.indexOf("Explanation:");
        if (split < 0) return new GenerateApiResponse(raw.trim(), "");
        return new GenerateApiResponse(raw.substring(0, split).trim(), raw.substring(split + "Explanation:".length()).trim());
    }

    public ExplainIgResponse explainIg(ExplainIgRequest req) {
        String resourceType = req.resourceType();
        String rules = (resourceType != null && !resourceType.isBlank())
                ? validationService.describeRules(resourceType)
                : "No specific resource type selected.";

        String user = """
                Persona: %s
                FHIR version: %s
                Implementation guide: %s
                Resource type in focus: %s
                Sandbox-configured rules for that resource type (ground your checklist in these where relevant): %s

                Question: %s

                Answer in plain language appropriate for the persona, covering Must Support obligations, cardinality, \
                terminology bindings, and profile/slicing constraints as relevant. Then provide a short implementation \
                checklist as a numbered list.""".formatted(
                orDefault(req.persona(), "API Developer"), orDefault(req.fhirVersion(), "FHIR R4"),
                orDefault(req.implementationGuide(), "Base FHIR"), orDefault(resourceType, "(none)"), rules, req.question());

        String raw = groqClient.complete(DESIGN_SYSTEM_PROMPT, user, 0.3, 1200);
        return new ExplainIgResponse(raw, extractNumberedList(raw));
    }

    private static String orDefault(String value, String fallback) {
        return (value == null || value.isBlank()) ? fallback : value;
    }

    private static String stripCodeFences(String text) {
        String t = text.trim();
        if (t.startsWith("```")) {
            int firstNewline = t.indexOf('\n');
            if (firstNewline >= 0) t = t.substring(firstNewline + 1);
            if (t.endsWith("```")) t = t.substring(0, t.length() - 3);
        }
        return t.trim();
    }

    private static List<String> extractNumberedList(String text) {
        List<String> items = new ArrayList<>();
        for (String line : text.split("\n")) {
            String trimmed = line.trim();
            if (trimmed.matches("^\\d+[.)]\\s+.*")) {
                items.add(trimmed.replaceFirst("^\\d+[.)]\\s+", ""));
            }
        }
        return items;
    }
}
