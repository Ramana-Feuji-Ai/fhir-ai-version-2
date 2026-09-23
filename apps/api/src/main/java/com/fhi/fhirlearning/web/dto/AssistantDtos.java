package com.fhi.fhirlearning.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class AssistantDtos {

    private AssistantDtos() {}

    public record AssistantAskRequest(
            @NotBlank @Pattern(regexp = "topic|phase|none") String contextType,
            Long contextId,
            @NotBlank String question
    ) {}

    public record AssistantAskResponse(String answer) {}
}
