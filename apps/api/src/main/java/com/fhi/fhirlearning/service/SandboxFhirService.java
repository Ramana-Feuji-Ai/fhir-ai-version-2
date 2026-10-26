package com.fhi.fhirlearning.service;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.fhi.fhirlearning.domain.sandbox.SandboxResource;
import com.fhi.fhirlearning.domain.sandbox.SandboxResourceHistory;
import com.fhi.fhirlearning.repo.SandboxResourceHistoryRepository;
import com.fhi.fhirlearning.repo.SandboxResourceRepository;
import com.fhi.fhirlearning.web.dto.SandboxDtos.ResourceTypeMetaDto;
import com.fhi.fhirlearning.web.dto.SandboxDtos.SandboxMetaDto;

/**
 * Simulated FHIR REST server backing the developer sandbox (FR-006..FR-010): read, search, create,
 * update, delete, history, and transaction/batch Bundle processing over a small set of resource
 * types, with lightweight validation and an in-database version history.
 */
@Service
public class SandboxFhirService {

    private final SandboxResourceRepository resourceRepository;
    private final SandboxResourceHistoryRepository historyRepository;
    private final SandboxValidationService validationService;
    private final ObjectMapper mapper;

    public SandboxFhirService(
            SandboxResourceRepository resourceRepository,
            SandboxResourceHistoryRepository historyRepository,
            SandboxValidationService validationService,
            ObjectMapper mapper
    ) {
        this.resourceRepository = resourceRepository;
        this.historyRepository = historyRepository;
        this.validationService = validationService;
        this.mapper = mapper;
    }

    public record WriteResult(JsonNode resource, int versionId, boolean created) {}

    private record EntryOutcome(String status, String location, JsonNode resource) {}

    // ---------------------------------------------------------------- public API

    @Transactional(readOnly = true)
    public JsonNode read(String type, String id) {
        return doRead(type, id);
    }

    @Transactional(readOnly = true)
    public JsonNode search(String type, MultiValueMap<String, String> params) {
        return doSearch(type, params);
    }

    @Transactional
    public WriteResult create(String type, String bodyJson) {
        return doCreate(type, parse(bodyJson));
    }

    @Transactional
    public WriteResult update(String type, String id, String bodyJson) {
        return doUpdate(type, id, parse(bodyJson));
    }

    @Transactional
    public void delete(String type, String id) {
        doDelete(type, id);
    }

    @Transactional(readOnly = true)
    public JsonNode history(String type, String id) {
        return doHistory(type, id);
    }

    @Transactional
    public JsonNode processBundle(String bodyJson) {
        ObjectNode bundle = parse(bodyJson);
        if (!"Bundle".equals(bundle.path("resourceType").asText())) {
            throw badRequest("Request body must be a Bundle resource");
        }
        String bundleType = bundle.path("type").asText();
        boolean isTransaction = "transaction".equals(bundleType);
        if (!isTransaction && !"batch".equals(bundleType)) {
            throw badRequest("Bundle.type must be 'transaction' or 'batch' (got '" + bundleType + "')");
        }

        ArrayNode responseEntries = mapper.createArrayNode();
        for (JsonNode entryNode : bundle.path("entry")) {
            try {
                EntryOutcome outcome = processEntry(entryNode);
                responseEntries.add(toResponseNode(outcome));
            } catch (SandboxOperationException e) {
                if (isTransaction) throw e;
                responseEntries.add(errorEntryNode(e));
            }
        }

        ObjectNode response = mapper.createObjectNode();
        response.put("resourceType", "Bundle");
        response.put("type", isTransaction ? "transaction-response" : "batch-response");
        response.set("entry", responseEntries);
        return response;
    }

    @Transactional(readOnly = true)
    public SandboxMetaDto meta() {
        List<ResourceTypeMetaDto> list = new ArrayList<>();
        for (String type : validationService.supportedResourceTypes()) {
            List<SandboxResource> rows = resourceRepository.findByResourceTypeAndDeletedFalse(type);
            List<String> sampleIds = rows.stream().map(SandboxResource::getFhirId).sorted().limit(5).toList();
            list.add(new ResourceTypeMetaDto(type, rows.size(), sampleIds));
        }
        return new SandboxMetaDto(list);
    }

    // ---------------------------------------------------------------- CRUD internals

    private JsonNode doRead(String type, String id) {
        ensureSupportedType(type);
        SandboxResource row = resourceRepository.findByResourceTypeAndFhirId(type, id)
                .filter(r -> !r.isDeleted())
                .orElseThrow(() -> notFound(type + "/" + id + " was not found"));
        return injectMeta(parse(row.getPayload()), row.getVersionId(), row.getLastUpdated());
    }

    private JsonNode doSearch(String type, MultiValueMap<String, String> params) {
        ensureSupportedType(type);
        List<SandboxResource> candidates = resourceRepository.findByResourceTypeAndDeletedFalse(type);
        List<ObjectNode> matches = new ArrayList<>();
        for (SandboxResource row : candidates) {
            ObjectNode node = parse(row.getPayload());
            if (matchesAll(node, params)) {
                matches.add(injectMeta(node, row.getVersionId(), row.getLastUpdated()));
            }
        }
        return buildSearchBundle(type, matches);
    }

    private WriteResult doCreate(String type, JsonNode bodyRaw) {
        ensureSupportedType(type);
        if (!bodyRaw.isObject()) throw badRequest("Request body must be a JSON object");
        ObjectNode body = (ObjectNode) bodyRaw;

        List<SandboxValidationService.ValidationIssue> issues = validationService.validate(type, body);
        if (!issues.isEmpty()) throw unprocessable(issues);

        String fhirId = body.hasNonNull("id") ? body.get("id").asText() : generateId(type);

        Optional<SandboxResource> existing = resourceRepository.findByResourceTypeAndFhirId(type, fhirId);
        if (existing.isPresent() && !existing.get().isDeleted()) {
            throw conflict("A " + type + " with id '" + fhirId + "' already exists. Use PUT " + type + "/" + fhirId + " to update it.");
        }
        int versionId = existing.map(r -> r.getVersionId() + 1).orElse(1);

        ObjectNode toStore = body.deepCopy();
        toStore.put("id", fhirId);
        toStore.remove("meta");
        String payload = toStore.toString();
        Instant now = Instant.now();

        SandboxResource row = existing.orElseGet(SandboxResource::new);
        row.setResourceType(type);
        row.setFhirId(fhirId);
        row.setVersionId(versionId);
        row.setPayload(payload);
        row.setLastUpdated(now);
        row.setDeleted(false);
        resourceRepository.save(row);

        saveHistory(type, fhirId, versionId, payload, now, "CREATE", false);

        return new WriteResult(injectMeta(toStore, versionId, now), versionId, true);
    }

    private WriteResult doUpdate(String type, String id, JsonNode bodyRaw) {
        ensureSupportedType(type);
        if (!bodyRaw.isObject()) throw badRequest("Request body must be a JSON object");
        ObjectNode body = (ObjectNode) bodyRaw;
        if (body.hasNonNull("id") && !id.equals(body.get("id").asText())) {
            throw badRequest("Body id '" + body.get("id").asText() + "' does not match URL id '" + id + "'");
        }

        List<SandboxValidationService.ValidationIssue> issues = validationService.validate(type, body);
        if (!issues.isEmpty()) throw unprocessable(issues);

        Optional<SandboxResource> existingOpt = resourceRepository.findByResourceTypeAndFhirId(type, id);
        boolean created = existingOpt.isEmpty() || existingOpt.get().isDeleted();
        int versionId = existingOpt.map(r -> r.getVersionId() + 1).orElse(1);

        ObjectNode toStore = body.deepCopy();
        toStore.put("id", id);
        toStore.remove("meta");
        String payload = toStore.toString();
        Instant now = Instant.now();

        SandboxResource row = existingOpt.orElseGet(SandboxResource::new);
        row.setResourceType(type);
        row.setFhirId(id);
        row.setVersionId(versionId);
        row.setPayload(payload);
        row.setLastUpdated(now);
        row.setDeleted(false);
        resourceRepository.save(row);

        saveHistory(type, id, versionId, payload, now, "UPDATE", false);

        return new WriteResult(injectMeta(toStore, versionId, now), versionId, created);
    }

    private void doDelete(String type, String id) {
        ensureSupportedType(type);
        SandboxResource row = resourceRepository.findByResourceTypeAndFhirId(type, id)
                .filter(r -> !r.isDeleted())
                .orElseThrow(() -> notFound(type + "/" + id + " was not found (or already deleted)"));
        int versionId = row.getVersionId() + 1;
        Instant now = Instant.now();
        row.setVersionId(versionId);
        row.setLastUpdated(now);
        row.setDeleted(true);
        resourceRepository.save(row);
        saveHistory(type, id, versionId, row.getPayload(), now, "DELETE", true);
    }

    private JsonNode doHistory(String type, String id) {
        ensureSupportedType(type);
        List<SandboxResourceHistory> rows = historyRepository.findByResourceTypeAndFhirIdOrderByVersionIdDesc(type, id);
        if (rows.isEmpty()) throw notFound(type + "/" + id + " has no history");

        ObjectNode bundle = mapper.createObjectNode();
        bundle.put("resourceType", "Bundle");
        bundle.put("type", "history");
        bundle.put("total", rows.size());
        ArrayNode entries = bundle.putArray("entry");
        for (SandboxResourceHistory row : rows) {
            ObjectNode entry = entries.addObject();
            entry.put("fullUrl", type + "/" + id + "/_history/" + row.getVersionId());

            ObjectNode request = mapper.createObjectNode();
            request.put("method", row.getOperation());
            request.put("url", type + "/" + id);
            entry.set("request", request);

            ObjectNode response = mapper.createObjectNode();
            response.put("status", row.isDeleted() ? "204 No Content" : (row.getVersionId() == 1 ? "201 Created" : "200 OK"));
            response.put("lastModified", row.getLastUpdated().toString());
            entry.set("response", response);

            if (!row.isDeleted()) {
                entry.set("resource", injectMeta(parse(row.getPayload()), row.getVersionId(), row.getLastUpdated()));
            }
        }
        return bundle;
    }

    // ---------------------------------------------------------------- transaction/batch

    private EntryOutcome processEntry(JsonNode entryNode) {
        JsonNode request = entryNode.path("request");
        String method = request.path("method").asText("").toUpperCase();
        String url = request.path("url").asText("");
        if (method.isBlank() || url.isBlank()) {
            throw badRequest("Bundle entry is missing request.method or request.url");
        }

        String path = url;
        MultiValueMap<String, String> query = new LinkedMultiValueMap<>();
        int q = url.indexOf('?');
        if (q >= 0) {
            path = url.substring(0, q);
            for (String pair : url.substring(q + 1).split("&")) {
                if (pair.isBlank()) continue;
                String[] kv = pair.split("=", 2);
                String key = URLDecoder.decode(kv[0], StandardCharsets.UTF_8);
                String value = kv.length > 1 ? URLDecoder.decode(kv[1], StandardCharsets.UTF_8) : "";
                query.add(key, value);
            }
        }
        String[] segments = path.split("/");
        if (segments.length == 0 || segments[0].isBlank()) throw badRequest("Invalid entry url: " + url);
        String type = segments[0];
        String id = segments.length > 1 ? segments[1] : null;

        return switch (method) {
            case "GET" -> id == null
                    ? new EntryOutcome("200 OK", null, doSearch(type, query))
                    : new EntryOutcome("200 OK", null, doRead(type, id));
            case "POST" -> {
                WriteResult result = doCreate(type, entryNode.path("resource"));
                String location = type + "/" + result.resource().path("id").asText() + "/_history/" + result.versionId();
                yield new EntryOutcome("201 Created", location, result.resource());
            }
            case "PUT" -> {
                if (id == null) throw badRequest("PUT entry url must include an id: " + url);
                WriteResult result = doUpdate(type, id, entryNode.path("resource"));
                String status = result.created() ? "201 Created" : "200 OK";
                String location = type + "/" + id + "/_history/" + result.versionId();
                yield new EntryOutcome(status, location, result.resource());
            }
            case "DELETE" -> {
                if (id == null) throw badRequest("DELETE entry url must include an id: " + url);
                doDelete(type, id);
                yield new EntryOutcome("204 No Content", null, null);
            }
            default -> throw badRequest("Unsupported bundle entry method: " + method);
        };
    }

    private JsonNode toResponseNode(EntryOutcome outcome) {
        ObjectNode entry = mapper.createObjectNode();
        ObjectNode response = mapper.createObjectNode();
        response.put("status", outcome.status());
        if (outcome.location() != null) response.put("location", outcome.location());
        entry.set("response", response);
        if (outcome.resource() != null) entry.set("resource", outcome.resource());
        return entry;
    }

    private JsonNode errorEntryNode(SandboxOperationException e) {
        ObjectNode entry = mapper.createObjectNode();
        ObjectNode response = mapper.createObjectNode();
        response.put("status", e.getStatus().value() + " " + e.getStatus().getReasonPhrase());
        entry.set("response", response);
        entry.set("outcome", e.getOutcome());
        return entry;
    }

    // ---------------------------------------------------------------- search matching

    private boolean matchesAll(JsonNode resource, MultiValueMap<String, String> params) {
        for (Map.Entry<String, List<String>> e : params.entrySet()) {
            String param = e.getKey();
            if (param.startsWith("_") && !"_id".equals(param)) continue;
            for (String value : e.getValue()) {
                if (value == null || value.isBlank()) continue;
                if (!matchesParam(resource, param, value)) return false;
            }
        }
        return true;
    }

    private boolean matchesParam(JsonNode resource, String param, String value) {
        switch (param) {
            case "_id":
                return value.equals(resource.path("id").asText(""));
            case "identifier": {
                String needle = value.contains("|") ? value.substring(value.indexOf('|') + 1) : value;
                for (JsonNode id : resource.path("identifier")) {
                    if (needle.equalsIgnoreCase(id.path("value").asText(""))) return true;
                }
                return false;
            }
            case "name":
            case "family":
            case "given": {
                for (JsonNode name : resource.path("name")) {
                    if (containsIgnoreCase(name.path("family").asText(""), value)) return true;
                    for (JsonNode given : name.path("given")) {
                        if (containsIgnoreCase(given.asText(""), value)) return true;
                    }
                }
                return false;
            }
            case "gender":
            case "status":
            case "intent":
            case "use":
                return value.equalsIgnoreCase(resource.path(param).asText(""));
            case "patient":
            case "subject":
            case "beneficiary": {
                String reference = firstNonBlank(
                        resource.path("subject").path("reference").asText(""),
                        resource.path("patient").path("reference").asText(""),
                        resource.path("beneficiary").path("reference").asText(""));
                return reference.equals(value) || reference.endsWith("/" + value);
            }
            case "code": {
                for (JsonNode coding : resource.path("code").path("coding")) {
                    if (value.equalsIgnoreCase(coding.path("code").asText(""))) return true;
                }
                return false;
            }
            default: {
                JsonNode field = resource.get(param);
                if (field == null) return false;
                if (field.isTextual()) return value.equalsIgnoreCase(field.asText());
                if (field.isObject() && field.has("reference")) {
                    return field.path("reference").asText("").endsWith(value);
                }
                return false;
            }
        }
    }

    private static boolean containsIgnoreCase(String haystack, String needle) {
        return haystack != null && needle != null && haystack.toLowerCase().contains(needle.toLowerCase());
    }

    private static String firstNonBlank(String... values) {
        for (String v : values) {
            if (v != null && !v.isBlank()) return v;
        }
        return "";
    }

    private JsonNode buildSearchBundle(String type, List<ObjectNode> matches) {
        ObjectNode bundle = mapper.createObjectNode();
        bundle.put("resourceType", "Bundle");
        bundle.put("type", "searchset");
        bundle.put("total", matches.size());
        ArrayNode entries = bundle.putArray("entry");
        for (ObjectNode match : matches) {
            ObjectNode entry = entries.addObject();
            entry.put("fullUrl", type + "/" + match.path("id").asText());
            entry.set("resource", match);
            ObjectNode search = mapper.createObjectNode();
            search.put("mode", "match");
            entry.set("search", search);
        }
        return bundle;
    }

    // ---------------------------------------------------------------- helpers

    private void ensureSupportedType(String type) {
        if (!validationService.isSupportedResourceType(type)) {
            throw notFound("Unknown resource type '" + type + "' in this sandbox. Supported types: "
                    + validationService.supportedResourceTypes());
        }
    }

    private void saveHistory(String type, String fhirId, int versionId, String payload, Instant now, String operation, boolean deleted) {
        SandboxResourceHistory history = new SandboxResourceHistory();
        history.setResourceType(type);
        history.setFhirId(fhirId);
        history.setVersionId(versionId);
        history.setPayload(payload);
        history.setLastUpdated(now);
        history.setOperation(operation);
        history.setDeleted(deleted);
        historyRepository.save(history);
    }

    private static String generateId(String type) {
        return type.toLowerCase() + "-" + java.util.UUID.randomUUID().toString().substring(0, 8);
    }

    private ObjectNode injectMeta(ObjectNode node, int versionId, Instant lastUpdated) {
        ObjectNode meta = mapper.createObjectNode();
        meta.put("versionId", String.valueOf(versionId));
        meta.put("lastUpdated", lastUpdated.toString());
        node.set("meta", meta);
        return node;
    }

    private ObjectNode parse(String json) {
        try {
            JsonNode node = mapper.readTree(json);
            if (node == null || !node.isObject()) throw badRequest("Request body must be a JSON object");
            return (ObjectNode) node;
        } catch (JsonProcessingException e) {
            throw badRequest("Invalid JSON: " + e.getOriginalMessage());
        }
    }

    private SandboxOperationException badRequest(String message) {
        return new SandboxOperationException(HttpStatus.BAD_REQUEST, singleIssueOutcome("error", "invalid", message));
    }

    private SandboxOperationException notFound(String message) {
        return new SandboxOperationException(HttpStatus.NOT_FOUND, singleIssueOutcome("error", "not-found", message));
    }

    private SandboxOperationException conflict(String message) {
        return new SandboxOperationException(HttpStatus.CONFLICT, singleIssueOutcome("error", "conflict", message));
    }

    private SandboxOperationException unprocessable(List<SandboxValidationService.ValidationIssue> issues) {
        return new SandboxOperationException(HttpStatus.BAD_REQUEST, issuesOutcome(issues));
    }

    private ObjectNode singleIssueOutcome(String severity, String code, String diagnostics) {
        ObjectNode oo = mapper.createObjectNode();
        oo.put("resourceType", "OperationOutcome");
        ArrayNode issues = oo.putArray("issue");
        ObjectNode issue = issues.addObject();
        issue.put("severity", severity);
        issue.put("code", code);
        issue.put("diagnostics", diagnostics);
        return oo;
    }

    private ObjectNode issuesOutcome(List<SandboxValidationService.ValidationIssue> issues) {
        ObjectNode oo = mapper.createObjectNode();
        oo.put("resourceType", "OperationOutcome");
        ArrayNode arr = oo.putArray("issue");
        for (SandboxValidationService.ValidationIssue vi : issues) {
            ObjectNode issue = arr.addObject();
            issue.put("severity", vi.severity());
            issue.put("code", vi.code());
            issue.put("diagnostics", vi.diagnostics());
            issue.putArray("expression").add(vi.expression());
        }
        return oo;
    }
}
