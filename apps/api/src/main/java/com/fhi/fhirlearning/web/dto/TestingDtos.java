package com.fhi.fhirlearning.web.dto;

import java.util.List;
import java.util.Map;

import jakarta.validation.constraints.NotBlank;

/** PRD 8.4 Test Case and Test Data Assistant (FR-017..FR-021). */
public final class TestingDtos {
    private TestingDtos() {}

    public record GenerateTestCasesRequest(
            @NotBlank String resource, String taxonomy, String acceptanceCriteria
    ) {}

    public record TestCaseDto(String id, String type, String scenario, String expectedResult) {}

    public record GenerateTestCasesResponse(List<TestCaseDto> cases) {}

    public enum DefectInjection { NONE, TERMINOLOGY, REFERENCE, MIXED }

    public record GenerateTestDataRequest(
            String scenario, int patientCount, String fhirVersion, DefectInjection defectInjection,
            Long seed, boolean writeToSandbox
    ) {}

    public record GeneratedResourceDto(String resourceType, String id, boolean valid, List<String> issues, boolean writtenToSandbox) {}

    public record GenerateTestDataResponse(
            long seed, String fhirVersion, Map<String, Long> resourceCounts, int defectCount,
            int writtenToSandboxCount, List<GeneratedResourceDto> resources, String bundleJson
    ) {}

    public record ExplainFailureRequest(String resourceType, String payload, String observedError) {}

    public record ValidationIssueDto(String severity, String code, String expression, String diagnostics) {}

    public record ExplainFailureResponse(List<ValidationIssueDto> issues, String explanation) {}
}
