package com.fhi.fhirlearning.web.dto;

import java.util.List;

public final class CourseDtos {
    private CourseDtos() {}

    public record CourseSummaryDto(
            String slug, String title, String role, String level, String category,
            String duration, int studyHours, String prerequisites, String accent,
            String description, String practicalOutcome, List<String> outcomes,
            List<Integer> phaseIds,
            int moduleCount, int topicCount, int topicDone, int percentComplete,
            boolean completed) {}

    public record CourseDetailDto(CourseSummaryDto course, List<CourseModuleDto> modules) {}

        public record EnrollmentDto(String slug, String enrolledAt, boolean completed, String certificateNumber) {}

    public record CourseModuleDto(
            short phaseId, String title, String description, String duration,
            int topicCount, int topicDone, int percentComplete, boolean completed,
            List<String> topicTitles) {}
}