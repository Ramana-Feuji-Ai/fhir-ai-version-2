package com.fhi.fhirlearning.service;

import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.fhi.fhirlearning.domain.phase.Phase;
import com.fhi.fhirlearning.domain.phase.Topic;
import com.fhi.fhirlearning.repo.PhaseRepository;
import com.fhi.fhirlearning.repo.TopicProgressRepository;
import com.fhi.fhirlearning.security.SecurityUtils;
import com.fhi.fhirlearning.util.TextNormalizer;
import com.fhi.fhirlearning.web.dto.CourseDtos.CourseDetailDto;
import com.fhi.fhirlearning.web.dto.CourseDtos.CourseModuleDto;
import com.fhi.fhirlearning.web.dto.CourseDtos.CourseSummaryDto;

@Service
public class CourseService {
    private final PhaseRepository phases;
    private final TopicProgressRepository progress;

    public CourseService(PhaseRepository phases, TopicProgressRepository progress) {
        this.phases = phases;
        this.progress = progress;
    }

    @Transactional(readOnly = true)
    public List<CourseSummaryDto> list(String query, String level) {
        Map<Short, Long> done = completedByPhase();
        String q = query == null ? "" : query.trim().toLowerCase(Locale.ROOT);
        return definitions().stream()
                .filter(course -> level == null || level.isBlank() || "All levels".equalsIgnoreCase(level) || course.level.equalsIgnoreCase(level.trim()))
                .filter(course -> q.isEmpty() || (course.title + " " + course.role + " " + course.category).toLowerCase(Locale.ROOT).contains(q))
                .map(course -> summary(course, done))
                .toList();
    }

    @Transactional(readOnly = true)
    public CourseDetailDto get(String slug) {
        CourseDefinition definition = definitions().stream().filter(course -> course.slug.equals(slug)).findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course not found: " + slug));
        Map<Short, Long> done = completedByPhase();
        List<CourseModuleDto> modules = definition.phaseIds.stream()
            .map(Integer::shortValue)
            .map(phases::findById)
            .flatMap(java.util.Optional::stream)
            .map(phase -> module(phase, done)).toList();
        return new CourseDetailDto(summary(definition, done), modules);
    }

    private CourseSummaryDto summary(CourseDefinition course, Map<Short, Long> done) {
        List<Phase> selected = selectedPhases(course);
        int topics = selected.stream().mapToInt(this::topicCount).sum();
        int completed = selected.stream().mapToInt(phase -> Math.min(topicCount(phase), done.getOrDefault(phase.getId(), 0L).intValue())).sum();
        int percent = topics == 0 ? 0 : Math.round(completed * 100f / topics);
        return new CourseSummaryDto(course.slug, course.title, course.role, course.level, course.category, course.duration, course.studyHours, course.prerequisites, course.accent, course.description, course.practicalOutcome, course.outcomes, course.phaseIds, selected.size(), topics, completed, percent, percent == 100);
    }

    private CourseModuleDto module(Phase phase, Map<Short, Long> done) {
        int topics = topicCount(phase);
        int completed = Math.min(topics, done.getOrDefault(phase.getId(), 0L).intValue());
        int percent = topics == 0 ? 0 : Math.round(completed * 100f / topics);
        List<String> titles = phase.getSections().stream().flatMap(section -> section.getTopics().stream()).map(Topic::getTitle).map(TextNormalizer::clean).toList();
        return new CourseModuleDto(phase.getId(), TextNormalizer.clean(phase.getTitle()), TextNormalizer.clean(phase.getDescription()), TextNormalizer.clean(phase.getDuration()), topics, completed, percent, percent == 100, titles);
    }

    private List<Phase> selectedPhases(CourseDefinition course) {
        return phases.findAllByOrderBySortOrderAsc().stream().filter(phase -> course.phaseIds.contains((int) phase.getId())).toList();
    }

    private int topicCount(Phase phase) { return phase.getSections().stream().mapToInt(section -> section.getTopics().size()).sum(); }

    private Map<Short, Long> completedByPhase() {
        Map<Short, Long> result = new HashMap<>();
        for (Object[] row : progress.countCompletedGroupedByPhase(SecurityUtils.requireLearnerId())) result.put(((Number) row[0]).shortValue(), ((Number) row[1]).longValue());
        return result;
    }

    private List<CourseDefinition> definitions() {
        return List.of(
                new CourseDefinition("fhir-developer", "FHIR Developer", "Healthcare IT developers", "Intermediate", "Developer", "8 weeks", 32, "Basic programming and HTTP knowledge", "#1A6BB8", "Build production-ready FHIR integrations, APIs, profiles, and SMART applications from first principles.", "A working implementation plan for a secure FHIR application.", List.of("Design and exchange FHIR resources", "Build RESTful searches and integrations", "Implement SMART, Bulk Data, and validation patterns"), List.of(0, 1, 2, 3, 4, 5, 6, 7, 9, 10, 13, 14, 15)),
                new CourseDefinition("fhir-architect", "FHIR Systems Architect", "System architects", "Advanced", "Architect", "10 weeks", 40, "Experience designing healthcare or enterprise systems", "#7A4E2D", "Shape interoperable health-information platforms with sound architecture, governance, security, and conformance.", "An architecture blueprint for interoperable health-information exchange.", List.of("Evaluate interoperability architecture choices", "Plan profiles, terminology, and governance", "Design secure enterprise exchange patterns"), List.of(1, 2, 3, 9, 10, 11, 12, 13, 14, 16)),
                new CourseDefinition("fhir-qa-testing", "FHIR QA & Testing", "Quality assurance and test engineers", "Intermediate", "QA & Testing", "6 weeks", 24, "API testing fundamentals", "#13795B", "Validate FHIR implementations with repeatable API, resource, profile, terminology, and conformance testing.", "A repeatable test strategy for a FHIR implementation.", List.of("Build a FHIR validation strategy", "Test APIs, profiles, searches, and terminology", "Troubleshoot implementation failures systematically"), List.of(0, 2, 3, 9, 10, 11, 13, 14, 15, 16)),
                new CourseDefinition("fhir-project-leaders", "FHIR for Project Leaders", "Project managers and analysts", "Foundational", "Project Leadership", "4 weeks", 16, "No technical prerequisites", "#B85A12", "Understand the technical decisions, delivery risks, and vocabulary behind successful FHIR programs.", "A delivery roadmap with FHIR dependencies, risks, and milestones.", List.of("Translate FHIR concepts into project decisions", "Plan implementation milestones and dependencies", "Identify security, data, and conformance risks"), List.of(0, 1, 2, 3, 4, 9, 10, 12, 13, 16)),
                new CourseDefinition("fhir-for-clinical-workflows", "FHIR for Clinical Workflows", "Healthcare professionals", "Foundational", "Clinical", "5 weeks", 20, "Clinical workflow knowledge", "#9B3D68", "Gain a practical technical understanding of how FHIR represents patients, care, diagnostics, medications, and consent.", "A shared vocabulary for discussing clinical interoperability with technical teams.", List.of("Connect clinical workflows to FHIR resources", "Read exchanged patient and clinical data", "Understand privacy, consent, and safe interoperability"), List.of(0, 1, 3, 4, 5, 6, 7, 8, 9, 12))
        );
    }

    private record CourseDefinition(String slug, String title, String role, String level, String category, String duration, int studyHours, String prerequisites, String accent, String description, String practicalOutcome, List<String> outcomes, List<Integer> phaseIds) {}
}