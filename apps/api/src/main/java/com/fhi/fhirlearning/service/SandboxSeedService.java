package com.fhi.fhirlearning.service;

import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fhi.fhirlearning.domain.sandbox.SandboxResource;
import com.fhi.fhirlearning.domain.sandbox.SandboxResourceHistory;
import com.fhi.fhirlearning.repo.SandboxResourceHistoryRepository;
import com.fhi.fhirlearning.repo.SandboxResourceRepository;

/** Loads the bundled sandbox seed dataset on first boot and restores it on demand (FR-007, FR-010). */
@Component
public class SandboxSeedService implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(SandboxSeedService.class);
    private static final String SEED_CLASSPATH = "sandbox-seed/seed.json";

    private final SandboxResourceRepository resourceRepository;
    private final SandboxResourceHistoryRepository historyRepository;
    private final ObjectMapper mapper;

    public SandboxSeedService(
            SandboxResourceRepository resourceRepository,
            SandboxResourceHistoryRepository historyRepository,
            ObjectMapper mapper
    ) {
        this.resourceRepository = resourceRepository;
        this.historyRepository = historyRepository;
        this.mapper = mapper;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        if (resourceRepository.count() > 0) {
            log.info("Sandbox already seeded ({} resources); skipping", resourceRepository.count());
            return;
        }
        reset();
    }

    @Transactional
    public int reset() {
        historyRepository.deleteAllInBatch();
        resourceRepository.deleteAllInBatch();

        List<JsonNode> seedResources = readSeed();
        Instant now = Instant.now();
        int count = 0;
        for (JsonNode node : seedResources) {
            String resourceType = node.path("resourceType").asText();
            String fhirId = node.path("id").asText();
            String payload = node.toString();

            SandboxResource resource = new SandboxResource();
            resource.setResourceType(resourceType);
            resource.setFhirId(fhirId);
            resource.setVersionId(1);
            resource.setPayload(payload);
            resource.setLastUpdated(now);
            resource.setDeleted(false);
            resourceRepository.save(resource);

            SandboxResourceHistory history = new SandboxResourceHistory();
            history.setResourceType(resourceType);
            history.setFhirId(fhirId);
            history.setVersionId(1);
            history.setPayload(payload);
            history.setLastUpdated(now);
            history.setOperation("CREATE");
            history.setDeleted(false);
            historyRepository.save(history);
            count++;
        }
        log.info("Sandbox dataset reset to baseline: {} resources", count);
        return count;
    }

    private List<JsonNode> readSeed() {
        try (var in = new ClassPathResource(SEED_CLASSPATH).getInputStream()) {
            JsonNode root = mapper.readTree(in);
            List<JsonNode> list = new ArrayList<>();
            root.forEach(list::add);
            return list;
        } catch (IOException e) {
            throw new IllegalStateException("Could not load sandbox seed data from " + SEED_CLASSPATH, e);
        }
    }
}
