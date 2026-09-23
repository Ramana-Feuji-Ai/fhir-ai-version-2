package com.fhi.fhirlearning.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class AuthDtos {

    private AuthDtos() {}

    public record LoginRequest(
            @NotBlank @Email String email,
            @NotBlank String password
    ) {}

    public record RegisterRequest(
            @NotBlank @Email String email,
            @NotBlank @Size(min = 8, max = 100) String password,
            @NotBlank @Size(min = 2, max = 120) String displayName
    ) {}

    public record AuthResponse(
            String accessToken,
            String tokenType,
            LearnerMeDto learner
    ) {}

    public record LearnerMeDto(
            String id,
            String email,
            String displayName,
            String initials,
            String role
    ) {}
}
