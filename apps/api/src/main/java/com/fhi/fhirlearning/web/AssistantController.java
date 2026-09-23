package com.fhi.fhirlearning.web;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fhi.fhirlearning.service.AssistantService;
import com.fhi.fhirlearning.web.dto.AssistantDtos.AssistantAskRequest;
import com.fhi.fhirlearning.web.dto.AssistantDtos.AssistantAskResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/assistant")
public class AssistantController {

    private final AssistantService assistantService;

    public AssistantController(AssistantService assistantService) {
        this.assistantService = assistantService;
    }

    @PostMapping("/ask")
    public AssistantAskResponse ask(@Valid @RequestBody AssistantAskRequest body) {
        return assistantService.ask(body);
    }
}
