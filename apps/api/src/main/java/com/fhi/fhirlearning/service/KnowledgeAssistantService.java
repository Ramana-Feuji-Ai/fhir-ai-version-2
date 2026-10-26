package com.fhi.fhirlearning.service;

import java.time.Instant;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.fhi.fhirlearning.domain.knowledge.KnowledgeAsset;
import com.fhi.fhirlearning.repo.KnowledgeAssetRepository;
import com.fhi.fhirlearning.web.dto.KnowledgeDtos.AskRequest;
import com.fhi.fhirlearning.web.dto.KnowledgeDtos.AskResponse;
import com.fhi.fhirlearning.web.dto.KnowledgeDtos.CitationDto;
import com.fhi.fhirlearning.web.dto.KnowledgeDtos.KnowledgeAssetDto;

/**
 * Enterprise Knowledge Assistant (PRD 8.5, FR-022..FR-026). Like {@link AssistantService}, there is
 * no vector store: {@link #ask} keyword-scores approved {@link KnowledgeAsset} rows, hands the top
 * matches to the model as grounding context, and returns the answer alongside which assets it came
 * from so every response is citable back to a governed, versioned source. Only assets with status
 * {@code APPROVED} are ever searched or cited (FR-026); an administrator moves assets between
 * pending/approved/disabled via {@link #updateStatus}.
 */
@Service
public class KnowledgeAssistantService {

    private static final String KNOWLEDGE_SYSTEM_PROMPT = """
            You are the Enterprise Knowledge Assistant inside the FHIR Learning Academy platform. Answer ONLY using \
            the approved knowledge excerpts provided below -- do not use outside knowledge. If the excerpts do not \
            cover the question, say so plainly instead of guessing. Cite which knowledge asset(s) you used by title. \
            Adapt depth and tone to the stated persona: keep answers for a Business Analyst or Product Owner \
            conceptual and workflow-focused; for an API Developer or Interoperability Architect, include concrete \
            technical detail (field names, endpoints, patterns).""";

    private final KnowledgeAssetRepository repository;
    private final GroqClient groqClient;

    public KnowledgeAssistantService(KnowledgeAssetRepository repository, GroqClient groqClient) {
        this.repository = repository;
        this.groqClient = groqClient;
    }

    @Transactional(readOnly = true)
    public List<KnowledgeAssetDto> listAssets() {
        return repository.findAllByOrderByTitleAsc().stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public AskResponse ask(AskRequest req) {
        List<KnowledgeAsset> approved = repository.findByStatus(KnowledgeAsset.STATUS_APPROVED);
        List<KnowledgeAsset> matches = rank(approved, req.question());

        if (matches.isEmpty()) {
            return new AskResponse(
                    "No approved knowledge asset currently covers this question. Ask a broader question, or an "
                            + "administrator can add and approve a new knowledge asset for this topic.",
                    List.of());
        }

        StringBuilder context = new StringBuilder();
        for (KnowledgeAsset asset : matches) {
            context.append("### ").append(asset.getTitle())
                    .append(" (").append(asset.getAssetType()).append(", v").append(asset.getVersion()).append(")\n")
                    .append(asset.getContent()).append("\n\n");
        }

        String user = """
                Persona: %s

                Approved knowledge excerpts:
                %s

                Question: %s""".formatted(
                (req.persona() == null || req.persona().isBlank()) ? "API Developer" : req.persona(),
                context, req.question());

        String answer = groqClient.complete(KNOWLEDGE_SYSTEM_PROMPT, user, 0.2, 1200);
        List<CitationDto> citations = matches.stream()
                .map(a -> new CitationDto(a.getId(), a.getTitle(), a.getVersion(), a.getAssetType())).toList();
        return new AskResponse(answer, citations);
    }

    @Transactional
    public KnowledgeAssetDto updateStatus(UUID id, String status) {
        Set<String> allowed = Set.of(KnowledgeAsset.STATUS_APPROVED, KnowledgeAsset.STATUS_PENDING, KnowledgeAsset.STATUS_DISABLED);
        if (!allowed.contains(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "status must be one of " + allowed);
        }
        KnowledgeAsset asset = repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Knowledge asset not found"));
        asset.setStatus(status);
        asset.setUpdatedAt(Instant.now());
        return toDto(repository.save(asset));
    }

    /** Simple term-overlap ranking against title/tags/content -- consistent with the rest of the app's "no RAG" approach. */
    private List<KnowledgeAsset> rank(List<KnowledgeAsset> candidates, String question) {
        Set<String> terms = Arrays.stream(question.toLowerCase().split("[^a-z0-9]+"))
                .filter(t -> t.length() > 2).collect(Collectors.toSet());
        if (terms.isEmpty()) return List.of();

        return candidates.stream()
                .map(asset -> Map.entry(asset, score(asset, terms)))
                .filter(e -> e.getValue() > 0)
                .sorted(Comparator.<Map.Entry<KnowledgeAsset, Integer>>comparingInt(Map.Entry::getValue).reversed())
                .limit(4)
                .map(Map.Entry::getKey)
                .toList();
    }

    private int score(KnowledgeAsset asset, Set<String> terms) {
        String haystack = (asset.getTitle() + " " + asset.getTags() + " " + asset.getSummary() + " " + asset.getContent()).toLowerCase();
        int score = 0;
        for (String term : terms) {
            if (haystack.contains(term)) score++;
        }
        return score;
    }

    private KnowledgeAssetDto toDto(KnowledgeAsset asset) {
        return new KnowledgeAssetDto(asset.getId(), asset.getTitle(), asset.getAssetType(), asset.getVersion(),
                asset.getStatus(), asset.getTags(), asset.getSummary(), asset.getUpdatedAt());
    }
}
