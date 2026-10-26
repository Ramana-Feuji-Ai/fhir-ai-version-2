package com.fhi.fhirlearning.web;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fhi.fhirlearning.service.SyntheticDataService;
import com.fhi.fhirlearning.service.TestCaseAssistantService;
import com.fhi.fhirlearning.web.dto.TestingDtos.ExplainFailureRequest;
import com.fhi.fhirlearning.web.dto.TestingDtos.ExplainFailureResponse;
import com.fhi.fhirlearning.web.dto.TestingDtos.GenerateTestCasesRequest;
import com.fhi.fhirlearning.web.dto.TestingDtos.GenerateTestCasesResponse;
import com.fhi.fhirlearning.web.dto.TestingDtos.GenerateTestDataRequest;
import com.fhi.fhirlearning.web.dto.TestingDtos.GenerateTestDataResponse;

import jakarta.validation.Valid;

/** PRD 8.4 Test Case and Test Data Assistant (FR-017..FR-020). Export (FR-021) is done client-side. */
@RestController
@RequestMapping("/api/v1/testing")
public class TestingController {

    private final TestCaseAssistantService testCaseAssistantService;
    private final SyntheticDataService syntheticDataService;

    public TestingController(TestCaseAssistantService testCaseAssistantService, SyntheticDataService syntheticDataService) {
        this.testCaseAssistantService = testCaseAssistantService;
        this.syntheticDataService = syntheticDataService;
    }

    @PostMapping("/generate-test-cases")
    public GenerateTestCasesResponse generateTestCases(@Valid @RequestBody GenerateTestCasesRequest body) {
        return testCaseAssistantService.generateTestCases(body);
    }

    @PostMapping("/generate-test-data")
    public GenerateTestDataResponse generateTestData(@RequestBody GenerateTestDataRequest body) {
        return syntheticDataService.generate(body);
    }

    @PostMapping("/explain-failure")
    public ExplainFailureResponse explainFailure(@RequestBody ExplainFailureRequest body) {
        return testCaseAssistantService.explainFailure(body);
    }
}
