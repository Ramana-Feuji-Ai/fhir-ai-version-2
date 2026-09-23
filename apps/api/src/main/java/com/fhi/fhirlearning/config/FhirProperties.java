package com.fhi.fhirlearning.config;

import java.util.List;
import java.util.UUID;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "fhir")
public record FhirProperties(
        Seed seed,
        UUID demoLearnerId,
        Cors cors,
        Auth auth,
        Groq groq
) {
    public record Seed(boolean enabled, String phasesJson) {}
    public record Cors(List<String> allowedOrigins) {}
    public record Auth(
            String jwtSecret,
            long jwtExpirationMinutes,
            String demoEmail,
            String demoPassword
    ) {}
    public record Groq(String apiKey, String baseUrl, String model) {}
}
