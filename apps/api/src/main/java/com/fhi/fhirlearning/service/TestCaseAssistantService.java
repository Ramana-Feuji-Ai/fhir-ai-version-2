package com.fhi.fhirlearning.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fhi.fhirlearning.web.dto.TestingDtos.ExplainFailureRequest;
import com.fhi.fhirlearning.web.dto.TestingDtos.ExplainFailureResponse;
import com.fhi.fhirlearning.web.dto.TestingDtos.GenerateTestCasesRequest;
import com.fhi.fhirlearning.web.dto.TestingDtos.GenerateTestCasesResponse;
import com.fhi.fhirlearning.web.dto.TestingDtos.TestCaseDto;
import com.fhi.fhirlearning.web.dto.TestingDtos.ValidationIssueDto;

/**
 * Test Case and Test Data Assistant, LLM-backed half (PRD 8.4, FR-017, FR-018, FR-020). Test-case
 * generation and failure explanations are grounded with the sandbox's actual configured rules for
 * the resource type ({@link SandboxValidationService}) so negative cases reference real required
 * fields/status codes rather than invented ones. Deterministic synthetic-data generation (FR-019)
 * lives in {@link SyntheticDataService}.
 */
@Service
public class TestCaseAssistantService {

    private static final String TEST_SYSTEM_PROMPT = """
            You are the Test Case and Test Data Assistant inside the FHIR Learning Academy platform, helping QA \
            engineers write test cases and understand FHIR API validation failures for HL7 FHIR R4/R4B/R5 APIs. \
            Be concrete and traceable: reference actual field names, status codes, and HTTP status codes. \
            Test data must be synthetic; never suggest using real PHI.""";

    private final GroqClient groqClient;
    private final SandboxValidationService validationService;
    private final ObjectMapper mapper;

    public TestCaseAssistantService(GroqClient groqClient, SandboxValidationService validationService, ObjectMapper mapper) {
        this.groqClient = groqClient;
        this.validationService = validationService;
        this.mapper = mapper;
    }

    public GenerateTestCasesResponse generateTestCases(GenerateTestCasesRequest req) {
        String resource = req.resource();
        String rules = validationService.isSupportedResourceType(resource)
                ? validationService.describeRules(resource)
                : "No sandbox-configured rules for '" + resource + "'; use general FHIR R4 knowledge.";

        String user = """
                Resource / API: %s
                Test taxonomy requested: %s
                Sandbox-configured rules to test against where relevant: %s

                Acceptance criteria:
                %s

                Generate a numbered list of test cases covering the requested taxonomy (e.g. positive, negative, \
                boundary, regression, integration, interoperability, conformance, security as applicable). For each \
                test case, respond as one line in EXACTLY this pipe-delimited format, one per line, no extra prose:
                ID|TYPE|SCENARIO|EXPECTED RESULT
                Example: PT-001|Positive|Create valid Patient with required identifier and name|201 Created; Location and ETag returned.""".formatted(
                resource, orDefault(req.taxonomy(), "Complete suite"), rules,
                orDefault(req.acceptanceCriteria(), "(none provided; use typical FHIR API expectations for this resource)"));

        String raw = groqClient.complete(TEST_SYSTEM_PROMPT, user, 0.3, 1200);
        List<TestCaseDto> cases = parseTestCases(raw);
        return new GenerateTestCasesResponse(cases);
    }

    public ExplainFailureResponse explainFailure(ExplainFailureRequest req) {
        List<ValidationIssueDto> issues = new ArrayList<>();
        String groundedIssues = "(payload not provided or not structurally parseable; relying on the reported error text)";

        if (req.payload() != null && !req.payload().isBlank() && req.resourceType() != null
                && validationService.isSupportedResourceType(req.resourceType())) {
            try {
                JsonNode node = mapper.readTree(req.payload());
                var validationIssues = validationService.validate(req.resourceType(), node);
                for (var vi : validationIssues) {
                    issues.add(new ValidationIssueDto(vi.severity(), vi.code(), vi.expression(), vi.diagnostics()));
                }
                groundedIssues = validationIssues.isEmpty()
                        ? "The sandbox validator found no structural issues with this payload."
                        : validationIssues.stream().map(vi -> vi.expression() + " (" + vi.code() + "): " + vi.diagnostics())
                                .reduce((a, b) -> a + "\n" + b).orElse("");
            } catch (Exception e) {
                groundedIssues = "Payload could not be parsed as JSON: " + e.getMessage();
            }
        }

        String user = """
                Resource type: %s
                Observed error / OperationOutcome text from the caller: %s
                Deterministic sandbox validator findings for the submitted payload: %s

                Explain, in plain language a developer can act on, what is wrong and why, then give a short numbered \
                list of corrective actions.""".formatted(
                orDefault(req.resourceType(), "(unspecified)"),
                orDefault(req.observedError(), "(none provided)"),
                groundedIssues);

        String explanation = groqClient.complete(TEST_SYSTEM_PROMPT, user, 0.3, 1000);
        return new ExplainFailureResponse(issues, explanation);
    }

    private List<TestCaseDto> parseTestCases(String raw) {
        List<TestCaseDto> cases = new ArrayList<>();
        int auto = 1;
        for (String line : raw.split("\n")) {
            String trimmed = line.trim();
            if (trimmed.isEmpty() || !trimmed.contains("|")) continue;
            String[] parts = trimmed.split("\\|", 4);
            if (parts.length < 4) continue;
            String id = parts[0].trim().replaceFirst("^\\d+[.)]\\s*", "");
            if (id.isBlank() || id.equalsIgnoreCase("ID")) id = "TC-" + String.format("%03d", auto++);
            cases.add(new TestCaseDto(id, parts[1].trim(), parts[2].trim(), parts[3].trim()));
        }
        return cases;
    }

    private static String orDefault(String value, String fallback) {
        return (value == null || value.isBlank()) ? fallback : value;
    }
}
