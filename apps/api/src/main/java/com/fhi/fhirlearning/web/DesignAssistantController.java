package com.fhi.fhirlearning.web;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fhi.fhirlearning.service.DesignAssistantService;
import com.fhi.fhirlearning.web.dto.DesignDtos.ExplainIgRequest;
import com.fhi.fhirlearning.web.dto.DesignDtos.ExplainIgResponse;
import com.fhi.fhirlearning.web.dto.DesignDtos.GenerateApiRequest;
import com.fhi.fhirlearning.web.dto.DesignDtos.GenerateApiResponse;
import com.fhi.fhirlearning.web.dto.DesignDtos.GeneratePayloadRequest;
import com.fhi.fhirlearning.web.dto.DesignDtos.GeneratePayloadResponse;
import com.fhi.fhirlearning.web.dto.DesignDtos.RecommendResourcesRequest;
import com.fhi.fhirlearning.web.dto.DesignDtos.RecommendResourcesResponse;

import jakarta.validation.Valid;

/** PRD 8.3 FHIR Design and Development Assistant (FR-011..FR-016). */
@RestController
@RequestMapping("/api/v1/design")
public class DesignAssistantController {

    private final DesignAssistantService service;

    public DesignAssistantController(DesignAssistantService service) {
        this.service = service;
    }

    @PostMapping("/recommend-resources")
    public RecommendResourcesResponse recommendResources(@Valid @RequestBody RecommendResourcesRequest body) {
        return service.recommendResources(body);
    }

    @PostMapping("/generate-payload")
    public GeneratePayloadResponse generatePayload(@Valid @RequestBody GeneratePayloadRequest body) {
        return service.generatePayload(body);
    }

    @PostMapping("/generate-api-example")
    public GenerateApiResponse generateApiExample(@Valid @RequestBody GenerateApiRequest body) {
        return service.generateApiExample(body);
    }

    @PostMapping("/explain-ig")
    public ExplainIgResponse explainIg(@Valid @RequestBody ExplainIgRequest body) {
        return service.explainIg(body);
    }
}
