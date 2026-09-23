package org.fhirld.api.web.dto;

import java.util.List;

public final class Dtos {
    private Dtos() {
    }

    public record TopicSummaryDto(
            String slug,
            String title,
            String kicker,
            String durationHint,
            int phase,
            String summary,
            String interactiveType
    ) {}

    public record SectionDto(String heading, String body) {}

    public record LineDto(
            String speaker,
            String speakerName,
            String speakerRole,
            String text,
            String audioPath
    ) {}

    public record QuizPublicDto(Long id, String prompt, List<String> options) {}

    public record TopicDetailDto(
            String slug,
            String title,
            String kicker,
            String durationHint,
            int phase,
            String summary,
            List<String> references,
            String interactiveType,
            Object interactive,
            List<SectionDto> sections,
            List<LineDto> conversation,
            List<QuizPublicDto> quiz
    ) {}

    public record QuizCheckRequest(int selectedIndex) {}

    public record QuizCheckResponse(boolean correct, String explanation, int answerIndex) {}

    public record ProgressUpsert(String learnerKey, String topicSlug, boolean completed, int quizScore) {}
}
