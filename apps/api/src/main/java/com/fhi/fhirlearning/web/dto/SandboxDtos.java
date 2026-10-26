package com.fhi.fhirlearning.web.dto;

import java.util.List;

public final class SandboxDtos {
    private SandboxDtos() {}

    public record ResourceTypeMetaDto(String resourceType, long count, List<String> sampleIds) {}

    public record SandboxMetaDto(List<ResourceTypeMetaDto> resourceTypes) {}

    public record ResetResultDto(int resourceCount) {}
}
