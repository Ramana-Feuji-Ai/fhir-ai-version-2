package org.fhirld.api.web;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.fhirld.api.domain.LabPatient;
import org.fhirld.api.domain.LearnerProgress;
import org.fhirld.api.repo.LabPatientRepository;
import org.fhirld.api.repo.LearnerProgressRepository;
import org.fhirld.api.web.dto.Dtos.ProgressUpsert;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

@RestController
public class LabAndProgressController {

    private final LabPatientRepository patients;
    private final LearnerProgressRepository progress;
    private final ObjectMapper mapper;

    public LabAndProgressController(LabPatientRepository patients, LearnerProgressRepository progress,
            ObjectMapper mapper) {
        this.patients = patients;
        this.progress = progress;
        this.mapper = mapper;
    }

    @GetMapping("/api/progress/{learnerKey}")
    public List<LearnerProgress> progress(@PathVariable String learnerKey) {
        return progress.findByLearnerKey(learnerKey);
    }

    @PostMapping("/api/progress")
    public LearnerProgress upsert(@RequestBody ProgressUpsert body) {
        LearnerProgress row = progress.findByLearnerKeyAndTopicSlug(body.learnerKey(), body.topicSlug())
                .orElseGet(LearnerProgress::new);
        row.setLearnerKey(body.learnerKey());
        row.setTopicSlug(body.topicSlug());
        row.setCompleted(body.completed());
        row.setQuizScore(body.quizScore());
        row.setUpdatedAt(Instant.now());
        return progress.save(row);
    }

    @GetMapping("/fhir/Patient/{id}")
    public ResponseEntity<String> read(@PathVariable String id) {
        return patients.findById(id)
                .map(p -> ResponseEntity.ok().header("Content-Type", "application/fhir+json").body(p.getResourceJson()))
                .orElseGet(() -> ResponseEntity.status(404).body(outcome("not-found", "Patient/" + id + " was not found")));
    }

    @GetMapping("/fhir/Patient")
    public String search(@RequestParam(name = "family", required = false) String family,
            @RequestParam(name = "name", required = false) String name) {
        String q = family != null ? family : (name != null ? name : "");
        List<LabPatient> hits = q.isBlank() ? patients.findAll() : patients.findByFamilyContainingIgnoreCase(q);
        ObjectNode bundle = mapper.createObjectNode();
        bundle.put("resourceType", "Bundle");
        bundle.put("type", "searchset");
        bundle.put("total", hits.size());
        var entry = bundle.putArray("entry");
        for (LabPatient p : hits) {
            try {
                entry.addObject().set("resource", mapper.readTree(p.getResourceJson()));
            } catch (JsonProcessingException ignored) {
                // skip malformed seed rows
            }
        }
        return bundle.toString();
    }

    @PostMapping("/fhir/Patient")
    public ResponseEntity<String> create(@RequestBody Map<String, Object> body) {
        String id = UUID.randomUUID().toString().substring(0, 8);
        ObjectNode patient = mapper.valueToTree(body);
        patient.put("resourceType", "Patient");
        patient.put("id", id);
        LabPatient row = fromJson(id, patient);
        patients.save(row);
        return ResponseEntity.status(201)
                .header("Location", "/fhir/Patient/" + id)
                .header("Content-Type", "application/fhir+json")
                .body(patient.toString());
    }

    @PutMapping("/fhir/Patient/{id}")
    public ResponseEntity<String> update(@PathVariable String id, @RequestBody Map<String, Object> body) {
        ObjectNode patient = mapper.valueToTree(body);
        patient.put("resourceType", "Patient");
        patient.put("id", id);
        LabPatient row = fromJson(id, patient);
        patients.save(row);
        return ResponseEntity.ok().header("Content-Type", "application/fhir+json").body(patient.toString());
    }

    private LabPatient fromJson(String id, ObjectNode patient) {
        LabPatient row = new LabPatient();
        row.setResourceId(id);
        row.setResourceJson(patient.toString());
        if (patient.has("gender")) {
            row.setGender(patient.get("gender").asText());
        }
        if (patient.has("birthDate")) {
            row.setBirthDate(patient.get("birthDate").asText());
        }
        if (patient.has("name") && patient.get("name").isArray() && patient.get("name").size() > 0) {
            var name = patient.get("name").get(0);
            if (name.has("family")) {
                row.setFamily(name.get("family").asText());
            }
            if (name.has("given") && name.get("given").isArray() && name.get("given").size() > 0) {
                row.setGiven(name.get("given").get(0).asText());
            }
        }
        return row;
    }

    private String outcome(String code, String diagnostics) {
        return """
                {"resourceType":"OperationOutcome","issue":[{"severity":"error","code":"%s","diagnostics":"%s"}]}
                """.formatted(code, diagnostics);
    }
}
