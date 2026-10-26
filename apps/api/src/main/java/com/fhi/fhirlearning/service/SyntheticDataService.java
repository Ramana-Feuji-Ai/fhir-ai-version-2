package com.fhi.fhirlearning.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fhi.fhirlearning.web.dto.TestingDtos.DefectInjection;
import com.fhi.fhirlearning.web.dto.TestingDtos.GenerateTestDataRequest;
import com.fhi.fhirlearning.web.dto.TestingDtos.GenerateTestDataResponse;
import com.fhi.fhirlearning.web.dto.TestingDtos.GeneratedResourceDto;

/**
 * Synthetic FHIR test-data generator (PRD 8.4, FR-019). Deterministic -- a given seed always
 * produces the same coherent, non-PHI resource graph -- rather than LLM-generated, since test data
 * must be reproducible and the sandbox's validator (not a model) is the source of truth for what
 * counts as a "defect". Optionally writes the valid resources straight into the developer sandbox
 * (PRD 8.2) via {@link SandboxFhirService}, so a QA engineer can generate a dataset here and
 * immediately practice against it in the sandbox workbench.
 */
@Service
public class SyntheticDataService {

    private static final String[] FIRST_NAMES = {"Taylor", "Jordan", "Morgan", "Riley", "Casey", "Avery", "Rowan", "Quinn", "Dakota", "Emerson"};
    private static final String[] LAST_NAMES = {"Example", "Synthetic", "Testcase", "Sandbox", "Demo", "Sample", "Fixture", "Mock", "Placeholder", "Reference"};
    private static final String[] CITIES = {"Example City", "Sample Town", "Fixture Falls", "Demo Heights", "Sandbox Springs"};
    private static final String[] STATES = {"VA", "TX", "CA", "NY", "OH"};

    private final SandboxValidationService validationService;
    private final SandboxFhirService sandboxFhirService;
    private final ObjectMapper mapper;

    public SyntheticDataService(SandboxValidationService validationService, SandboxFhirService sandboxFhirService, ObjectMapper mapper) {
        this.validationService = validationService;
        this.sandboxFhirService = sandboxFhirService;
        this.mapper = mapper;
    }

    @Transactional
    public GenerateTestDataResponse generate(GenerateTestDataRequest req) {
        int patientCount = Math.max(1, Math.min(req.patientCount() <= 0 ? 10 : req.patientCount(), 1000));
        long seed = req.seed() != null ? req.seed() : 36001L;
        DefectInjection defectMode = req.defectInjection() != null ? req.defectInjection() : DefectInjection.NONE;
        Random random = new Random(seed);
        String fhirVersion = req.fhirVersion() == null || req.fhirVersion().isBlank() ? "FHIR R4" : req.fhirVersion();

        String orgId = "org-payer-synthetic-" + seed;
        String practitionerId = "practitioner-synthetic-" + seed;

        List<ObjectNode> resources = new ArrayList<>();
        resources.add(organization(orgId));
        resources.add(practitioner(practitionerId, random));

        for (int i = 0; i < patientCount; i++) {
            String patientId = "patient-synthetic-" + seed + "-" + i;
            boolean injectHere = defectMode != DefectInjection.NONE && shouldInject(random, defectMode);
            DefectInjection thisOnesDefect = injectHere ? pickDefectKind(random, defectMode) : DefectInjection.NONE;

            resources.add(patient(patientId, random));
            resources.add(encounter(patientId, seed, i, thisOnesDefect));
            resources.add(observation(patientId, seed, i, random, thisOnesDefect));
            resources.add(condition(patientId, seed, i, random, thisOnesDefect));
            resources.add(medicationRequest(patientId, seed, i, thisOnesDefect == DefectInjection.REFERENCE));
            resources.add(coverage(patientId, orgId, seed, i, thisOnesDefect));
        }

        List<GeneratedResourceDto> resourceDtos = new ArrayList<>();
        Map<String, Long> counts = new LinkedHashMap<>();
        int defectCount = 0;
        int writtenCount = 0;
        ArrayNode bundleEntries = mapper.createArrayNode();

        for (ObjectNode resource : resources) {
            String type = resource.path("resourceType").asText();
            String id = resource.path("id").asText();
            counts.merge(type, 1L, Long::sum);

            List<String> issues = new ArrayList<>();
            boolean valid = true;
            if (validationService.isSupportedResourceType(type)) {
                var validationIssues = validationService.validate(type, resource);
                valid = validationIssues.isEmpty();
                validationIssues.forEach(vi -> issues.add(vi.expression() + ": " + vi.diagnostics()));
            }
            if (!valid) defectCount++;

            boolean written = false;
            if (req.writeToSandbox() && valid && validationService.isSupportedResourceType(type)) {
                try {
                    sandboxFhirService.create(type, resource.toString());
                    written = true;
                    writtenCount++;
                } catch (SandboxOperationException e) {
                    issues.add("Sandbox rejected write: " + e.getOutcome().path("issue").path(0).path("diagnostics").asText(e.getMessage()));
                }
            }

            resourceDtos.add(new GeneratedResourceDto(type, id, valid, issues, written));

            ObjectNode entry = bundleEntries.addObject();
            entry.set("resource", resource);
            ObjectNode request = mapper.createObjectNode();
            request.put("method", "POST");
            request.put("url", type);
            entry.set("request", request);
        }

        ObjectNode bundle = mapper.createObjectNode();
        bundle.put("resourceType", "Bundle");
        bundle.put("type", "transaction");
        bundle.set("entry", bundleEntries);

        String bundleJson;
        try {
            bundleJson = mapper.writerWithDefaultPrettyPrinter().writeValueAsString(bundle);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not serialize generated dataset", e);
        }

        return new GenerateTestDataResponse(seed, fhirVersion, counts, defectCount, writtenCount, resourceDtos, bundleJson);
    }

    private boolean shouldInject(Random random, DefectInjection mode) {
        return mode == DefectInjection.MIXED ? random.nextDouble() < 0.3 : random.nextDouble() < 0.5;
    }

    private DefectInjection pickDefectKind(Random random, DefectInjection mode) {
        if (mode != DefectInjection.MIXED) return mode;
        return random.nextBoolean() ? DefectInjection.TERMINOLOGY : DefectInjection.REFERENCE;
    }

    private ObjectNode organization(String id) {
        ObjectNode n = mapper.createObjectNode();
        n.put("resourceType", "Organization");
        n.put("id", id);
        n.put("name", "Synthetic Payer Organization");
        return n;
    }

    private ObjectNode practitioner(String id, Random random) {
        ObjectNode n = mapper.createObjectNode();
        n.put("resourceType", "Practitioner");
        n.put("id", id);
        ArrayNode identifiers = n.putArray("identifier");
        identifiers.addObject().put("system", "http://hl7.org/fhir/sid/us-npi").put("value", String.valueOf(1000000000L + random.nextInt(899999999)));
        ArrayNode names = n.putArray("name");
        names.addObject().put("family", pick(LAST_NAMES, random)).putArray("given").add(pick(FIRST_NAMES, random));
        return n;
    }

    private ObjectNode patient(String id, Random random) {
        ObjectNode n = mapper.createObjectNode();
        n.put("resourceType", "Patient");
        n.put("id", id);
        ArrayNode identifiers = n.putArray("identifier");
        identifiers.addObject().put("system", "https://example.org/mrn").put("value", "SYN-" + (10000 + random.nextInt(89999)));
        ArrayNode names = n.putArray("name");
        names.addObject().put("use", "official").put("family", pick(LAST_NAMES, random)).putArray("given").add(pick(FIRST_NAMES, random));
        n.put("gender", pick(new String[]{"male", "female", "other", "unknown"}, random));
        n.put("birthDate", String.format("19%02d-%02d-%02d", 40 + random.nextInt(60), 1 + random.nextInt(12), 1 + random.nextInt(28)));
        ArrayNode address = n.putArray("address");
        address.addObject().put("use", "home").put("city", pick(CITIES, random)).put("state", pick(STATES, random));
        return n;
    }

    private ObjectNode encounter(String patientId, long seed, int i, DefectInjection defect) {
        ObjectNode n = mapper.createObjectNode();
        n.put("resourceType", "Encounter");
        n.put("id", "encounter-synthetic-" + seed + "-" + i);
        n.put("status", defect == DefectInjection.TERMINOLOGY ? "bogus-status" : "finished");
        n.putObject("class").put("system", "http://terminology.hl7.org/CodeSystem/v3-ActCode").put("code", "AMB").put("display", "ambulatory");
        n.putObject("subject").put("reference", "Patient/" + patientId);
        return n;
    }

    private ObjectNode observation(String patientId, long seed, int i, Random random, DefectInjection defect) {
        ObjectNode n = mapper.createObjectNode();
        n.put("resourceType", "Observation");
        n.put("id", "observation-synthetic-" + seed + "-" + i);
        n.put("status", defect == DefectInjection.TERMINOLOGY ? "not-a-real-status" : "final");
        ObjectNode code = n.putObject("code");
        ArrayNode coding = code.putArray("coding");
        coding.addObject().put("system", "http://loinc.org").put("code", "8867-4").put("display", "Heart rate");
        n.putObject("subject").put("reference", "Patient/" + (defect == DefectInjection.REFERENCE ? "does-not-exist-" + seed + "-" + i : patientId));
        n.putObject("valueQuantity").put("value", 60 + random.nextInt(60)).put("unit", "/min");
        return n;
    }

    private ObjectNode condition(String patientId, long seed, int i, Random random, DefectInjection defect) {
        ObjectNode n = mapper.createObjectNode();
        n.put("resourceType", "Condition");
        n.put("id", "condition-synthetic-" + seed + "-" + i);
        n.putObject("subject").put("reference", "Patient/" + patientId);
        ObjectNode code = n.putObject("code");
        ArrayNode coding = code.putArray("coding");
        ObjectNode c = coding.addObject();
        if (defect == DefectInjection.TERMINOLOGY) {
            c.put("system", "http://example.org/not-a-real-system").put("code", "INVALID-999");
        } else {
            c.put("system", "http://snomed.info/sct").put("code", "38341003").put("display", "Hypertension");
        }
        return n;
    }

    private ObjectNode medicationRequest(String patientId, long seed, int i, boolean danglingReference) {
        ObjectNode n = mapper.createObjectNode();
        n.put("resourceType", "MedicationRequest");
        n.put("id", "medicationrequest-synthetic-" + seed + "-" + i);
        n.put("status", "active");
        n.put("intent", "order");
        ObjectNode med = n.putObject("medicationCodeableConcept");
        med.putArray("coding").addObject().put("system", "http://www.nlm.nih.gov/research/umls/rxnorm").put("code", "197361").put("display", "Amoxicillin 250 MG");
        n.putObject("subject").put("reference", "Patient/" + (danglingReference ? "does-not-exist-" + seed + "-" + i : patientId));
        return n;
    }

    private ObjectNode coverage(String patientId, String orgId, long seed, int i, DefectInjection defect) {
        ObjectNode n = mapper.createObjectNode();
        n.put("resourceType", "Coverage");
        n.put("id", "coverage-synthetic-" + seed + "-" + i);
        n.put("status", defect == DefectInjection.TERMINOLOGY ? "invalid-status" : "active");
        n.putObject("beneficiary").put("reference", "Patient/" + patientId);
        n.putArray("payor").addObject().put("reference", "Organization/" + orgId);
        return n;
    }

    private static String pick(String[] values, Random random) {
        return values[random.nextInt(values.length)];
    }
}
