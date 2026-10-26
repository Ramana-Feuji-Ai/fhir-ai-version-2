package com.fhi.fhirlearning.seed;

import java.io.IOException;
import java.time.Instant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fhi.fhirlearning.domain.knowledge.KnowledgeAsset;
import com.fhi.fhirlearning.repo.KnowledgeAssetRepository;

/** Loads the bundled enterprise knowledge assets (PRD 8.5, FR-022) on first boot. */
@Component
@Order(20)
public class KnowledgeSeedRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(KnowledgeSeedRunner.class);
    private static final String SEED_CLASSPATH = "knowledge-seed/assets.json";

    private final KnowledgeAssetRepository repository;
    private final ObjectMapper mapper;

    public KnowledgeSeedRunner(KnowledgeAssetRepository repository, ObjectMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) throws Exception {
        if (repository.count() > 0) {
            log.info("Knowledge base already seeded ({} assets); skipping", repository.count());
            return;
        }
        int count = 0;
        for (JsonNode node : readSeed()) {
            KnowledgeAsset asset = new KnowledgeAsset();
            asset.setTitle(node.path("title").asText());
            asset.setAssetType(node.path("assetType").asText());
            asset.setVersion(node.path("version").asText());
            asset.setStatus(node.path("status").asText(KnowledgeAsset.STATUS_APPROVED));
            asset.setTags(node.path("tags").asText());
            asset.setSummary(node.path("summary").asText());
            asset.setContent(node.path("content").asText());
            asset.setUpdatedAt(Instant.now());
            repository.save(asset);
            count++;
        }
        log.info("Knowledge base seeded: {} assets", count);
    }

    private JsonNode readSeed() {
        try (var in = new ClassPathResource(SEED_CLASSPATH).getInputStream()) {
            return mapper.readTree(in);
        } catch (IOException e) {
            throw new IllegalStateException("Could not load knowledge seed data from " + SEED_CLASSPATH, e);
        }
    }
}
