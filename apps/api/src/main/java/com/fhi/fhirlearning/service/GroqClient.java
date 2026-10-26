package com.fhi.fhirlearning.service;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

import com.fhi.fhirlearning.config.FhirProperties;

/**
 * Thin shared wrapper around the Groq chat-completions endpoint. Every AI-backed feature (learning
 * assistant, design assistant, test/data assistant, enterprise knowledge assistant) grounds the
 * model with real application context (course content, sandbox validation rules, approved knowledge
 * assets, ...) rather than relying on a vector store, then calls {@link #complete} for one plain
 * completion. Centralized here so each feature service only needs to build its prompt.
 *
 * <p>The configured model (openai/gpt-oss-20b at the time of writing) is a <em>reasoning</em> model:
 * before writing its answer it spends some of {@code max_tokens} on a hidden "thinking" pass. If
 * that budget is too small, or {@code reasoning_effort} is left at Groq's default ("medium"), the
 * model can burn the entire token budget reasoning and return a 200 response with an empty
 * {@code message.content} -- no error, just nothing to show. We ask for low reasoning effort to
 * leave more of the budget for the actual answer, and treat empty content as a real failure (rather
 * than silently returning "") so it surfaces as an error the caller can see and act on.
 */
@Service
public class GroqClient {

    private static final Logger log = LoggerFactory.getLogger(GroqClient.class);

    private final FhirProperties.Groq config;
    private final RestClient restClient;

    public GroqClient(FhirProperties props) {
        this.config = props.groq();
        this.restClient = RestClient.create();
    }

    public boolean isConfigured() {
        return config != null && config.apiKey() != null && !config.apiKey().isBlank();
    }

    /** Calls the model with a system prompt and a single user message; returns the raw text answer. */
    public String complete(String systemPrompt, String userContent) {
        return complete(systemPrompt, userContent, 0.3, 1200);
    }

    public String complete(String systemPrompt, String userContent, double temperature, int maxTokens) {
        if (!isConfigured()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Assistant is not configured (missing GROQ_API_KEY)");
        }

        GroqMessage[] messages = {
                new GroqMessage("system", systemPrompt),
                new GroqMessage("user", userContent),
        };
        GroqRequest body = new GroqRequest(config.model(), messages, temperature, maxTokens, "low");

        GroqResponse response;
        try {
            response = restClient.post()
                    .uri(config.baseUrl() + "/chat/completions")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + config.apiKey())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(GroqResponse.class);
        } catch (RestClientException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Assistant request failed: " + e.getMessage(), e);
        }

        if (response == null || response.choices() == null || response.choices().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Assistant returned no answer");
        }

        GroqChoice choice = response.choices().get(0);
        String content = choice.message() == null ? null : choice.message().content();
        if (content == null || content.isBlank()) {
            log.warn("Groq returned empty content (finish_reason={}, max_tokens={}, model={})", choice.finish_reason(), maxTokens, config.model());
            String hint = "length".equals(choice.finish_reason())
                    ? " The model ran out of its token budget on internal reasoning before it could write an answer; try again, or shorten the question."
                    : " Try again.";
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Assistant returned an empty answer." + hint);
        }
        return content;
    }

    private record GroqMessage(String role, String content) {}

    private record GroqRequest(String model, GroqMessage[] messages, double temperature, int max_tokens, String reasoning_effort) {}

    private record GroqResponse(List<GroqChoice> choices) {}

    private record GroqChoice(GroqMessage message, String finish_reason) {}
}
