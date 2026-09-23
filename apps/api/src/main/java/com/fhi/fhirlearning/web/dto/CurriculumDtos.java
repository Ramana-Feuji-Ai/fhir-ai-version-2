package com.fhi.fhirlearning.web.dto;

import java.util.List;

public final class CurriculumDtos {

    private CurriculumDtos() {}

    public record TrackSummaryDto(String track, int phaseCount) {}

    public record CurriculumSummaryDto(
            int phaseCount,
            int topicCount,
            int topicDone,
            int percentComplete,
            int phasesCompleted,
            List<TrackSummaryDto> tracks
    ) {}

    public record PhaseCardDto(
            short id,
            String track,
            String title,
            String description,
            String duration,
            int topicCount,
            int sectionCount,
            int topicDone,
            int percentComplete,
            boolean completed
    ) {}

    public record SlideDto(long id, String title, String bodyHtml, short sortOrder) {}

    public record TopicSummaryDto(
            long id,
            String title,
            String summary,
            String legacyKey,
            int slideCount,
            boolean completed
    ) {}

    public record TopicDetailDto(
            long id,
            String title,
            String summary,
            String detailHtml,
            String examTip,
            String legacyKey,
            List<String> keyPoints,
            List<SlideDto> slides,
            boolean completed
    ) {}

    public record SectionDto(
            long id,
            String title,
            short sortOrder,
            List<TopicSummaryDto> topics
    ) {}

    public record SpecDto(String label, String url, String note) {}
    public record ExampleDto(String title, String body) {}
    public record LabDto(String title, String body) {}
    public record QuizQuestionDto(long id, String prompt, List<String> choices, short answerIndex, String explanation) {}

    public record PhaseResourcesDto(
            List<SpecDto> specs,
            List<ExampleDto> examples,
            LabDto lab,
            List<QuizQuestionDto> quiz
    ) {}

    public record PhaseDetailDto(
            short id,
            String track,
            String title,
            String description,
            String duration,
            List<String> objectives,
            List<String> outcomes,
            int topicTotal,
            int topicDone,
            int percentComplete,
            List<SectionDto> sections,
            PhaseResourcesDto resources
    ) {}

    public record PhaseProgressDto(
            short phaseId,
            int topicTotal,
            int topicDone,
            int percentComplete,
            List<String> completedLegacyKeys,
            List<Long> completedTopicIds
    ) {}

    public record TopicProgressRequest(boolean completed) {}
}
