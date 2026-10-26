package com.fhi.fhirlearning.web;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.databind.JsonNode;
import com.fhi.fhirlearning.service.SandboxFhirService;
import com.fhi.fhirlearning.service.SandboxFhirService.WriteResult;
import com.fhi.fhirlearning.service.SandboxOperationException;
import com.fhi.fhirlearning.service.SandboxSeedService;
import com.fhi.fhirlearning.web.dto.SandboxDtos.ResetResultDto;
import com.fhi.fhirlearning.web.dto.SandboxDtos.SandboxMetaDto;

/**
 * Simulated FHIR server used by the developer sandbox (PRD 8.2). Endpoints under {@code /fhir/**}
 * mimic the FHIR RESTful API (read/search/create/update/delete/history/transaction/batch);
 * {@code /meta} and {@code /reset} support the practice-workbench UI.
 */
@RestController
@RequestMapping("/api/v1/sandbox")
public class SandboxController {

    private final SandboxFhirService sandboxService;
    private final SandboxSeedService seedService;

    public SandboxController(SandboxFhirService sandboxService, SandboxSeedService seedService) {
        this.sandboxService = sandboxService;
        this.seedService = seedService;
    }

    @GetMapping("/meta")
    public SandboxMetaDto meta() {
        return sandboxService.meta();
    }

    @PostMapping("/reset")
    public ResetResultDto reset() {
        return new ResetResultDto(seedService.reset());
    }

    @GetMapping("/fhir/{type}/{id}")
    public ResponseEntity<JsonNode> read(@PathVariable String type, @PathVariable String id) {
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(sandboxService.read(type, id));
    }

    @GetMapping("/fhir/{type}/{id}/_history")
    public ResponseEntity<JsonNode> history(@PathVariable String type, @PathVariable String id) {
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(sandboxService.history(type, id));
    }

    @GetMapping("/fhir/{type}")
    public ResponseEntity<JsonNode> search(@PathVariable String type, @RequestParam MultiValueMap<String, String> params) {
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(sandboxService.search(type, params));
    }

    @PostMapping("/fhir/{type}")
    public ResponseEntity<JsonNode> create(@PathVariable String type, @RequestBody String body) {
        WriteResult result = sandboxService.create(type, body);
        return ResponseEntity.status(HttpStatus.CREATED)
                .header("Location", type + "/" + result.resource().path("id").asText() + "/_history/" + result.versionId())
                .header("ETag", "W/\"" + result.versionId() + "\"")
                .contentType(MediaType.APPLICATION_JSON)
                .body(result.resource());
    }

    @PutMapping("/fhir/{type}/{id}")
    public ResponseEntity<JsonNode> update(@PathVariable String type, @PathVariable String id, @RequestBody String body) {
        WriteResult result = sandboxService.update(type, id, body);
        HttpStatus status = result.created() ? HttpStatus.CREATED : HttpStatus.OK;
        return ResponseEntity.status(status)
                .header("Location", type + "/" + id + "/_history/" + result.versionId())
                .header("ETag", "W/\"" + result.versionId() + "\"")
                .contentType(MediaType.APPLICATION_JSON)
                .body(result.resource());
    }

    @DeleteMapping("/fhir/{type}/{id}")
    public ResponseEntity<Void> delete(@PathVariable String type, @PathVariable String id) {
        sandboxService.delete(type, id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/fhir")
    public ResponseEntity<JsonNode> processBundle(@RequestBody String body) {
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_JSON).body(sandboxService.processBundle(body));
    }

    @ExceptionHandler(SandboxOperationException.class)
    public ResponseEntity<JsonNode> handleSandboxOperationException(SandboxOperationException e) {
        return ResponseEntity.status(e.getStatus()).contentType(MediaType.APPLICATION_JSON).body(e.getOutcome());
    }
}
