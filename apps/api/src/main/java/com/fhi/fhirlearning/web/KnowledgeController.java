package com.fhi.fhirlearning.web;

import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fhi.fhirlearning.service.KnowledgeAssistantService;
import com.fhi.fhirlearning.web.dto.KnowledgeDtos.AskRequest;
import com.fhi.fhirlearning.web.dto.KnowledgeDtos.AskResponse;
import com.fhi.fhirlearning.web.dto.KnowledgeDtos.KnowledgeAssetDto;
import com.fhi.fhirlearning.web.dto.KnowledgeDtos.UpdateStatusRequest;

import jakarta.validation.Valid;

/** PRD 8.5 Enterprise Knowledge Assistant (FR-022..FR-026). */
@RestController
@RequestMapping("/api/v1/knowledge")
public class KnowledgeController {

    private final KnowledgeAssistantService service;

    public KnowledgeController(KnowledgeAssistantService service) {
        this.service = service;
    }

    @GetMapping("/assets")
    public List<KnowledgeAssetDto> listAssets() {
        return service.listAssets();
    }

    @PostMapping("/ask")
    public AskResponse ask(@Valid @RequestBody AskRequest body) {
        return service.ask(body);
    }

    @PutMapping("/assets/{id}/status")
    public KnowledgeAssetDto updateStatus(@PathVariable UUID id, @Valid @RequestBody UpdateStatusRequest body) {
        return service.updateStatus(id, body.status());
    }
}
