package com.fhi.fhirlearning.web.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;

/** PRD 8.5 Enterprise Knowledge Assistant (FR-022..FR-026). */
public final class KnowledgeDtos {
    private KnowledgeDtos() {}

    public record KnowledgeAssetDto(
            UUID id, String title, String assetType, String version, String status, String tags,
            String summary, Instant updatedAt
    ) {}

    public record AskRequest(String persona, @NotBlank String question) {}

    public record CitationDto(UUID assetId, String title, String version, String assetType) {}

    public record AskResponse(String answer, List<CitationDto> citations) {}

    public record UpdateStatusRequest(@NotBlank String status) {}
}
