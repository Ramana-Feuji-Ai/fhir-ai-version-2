package com.fhi.fhirlearning.service;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

import com.fhi.fhirlearning.config.FhirProperties;
import com.fhi.fhirlearning.domain.phase.Phase;
import com.fhi.fhirlearning.domain.phase.Section;
import com.fhi.fhirlearning.domain.phase.Slide;
import com.fhi.fhirlearning.domain.phase.Topic;
import com.fhi.fhirlearning.repo.PhaseRepository;
import com.fhi.fhirlearning.repo.TopicRepository;
import com.fhi.fhirlearning.web.dto.AssistantDtos.AssistantAskRequest;
import com.fhi.fhirlearning.web.dto.AssistantDtos.AssistantAskResponse;
import com.fhi.fhirlearning.web.dto.CourseDtos.CourseSummaryDto;
import com.fhi.fhirlearning.web.dto.CourseDtos.EnrollmentDto;
import com.fhi.fhirlearning.web.dto.CurriculumDtos.CurriculumSummaryDto;

/**
 * "Ask anything" assistant: no RAG, no vector store. The caller already knows
 * which topic/phase is on screen, so we just fetch that content directly and
 * hand it to the model as context for one plain chat completion. The learner's
 * overall progress and enrollments are always attached too, so "how am I doing"
 * style questions work regardless of what's on screen.
 */
@Service
public class AssistantService {

    private static final String SYSTEM_PROMPT = """
            You are a tutor embedded in the FHIR Learning Academy app, which teaches the HL7 FHIR \
            healthcare interoperability standard. Answer the learner's question using the course \
            material and learner progress provided below when it's relevant -- including questions \
            about their own progress, completion percentage, or enrolled courses. If no material is \
            provided, or the question goes beyond it, answer from your own knowledge of the real FHIR \
            R4 specification. Keep answers concise and to the point.""";

    private final TopicRepository topicRepository;
    private final PhaseRepository phaseRepository;
    private final CurriculumService curriculumService;
    private final CourseService courseService;
    private final EnrollmentService enrollmentService;
    private final FhirProperties.Groq groqConfig;
    private final RestClient restClient;

    public AssistantService(
            TopicRepository topicRepository,
            PhaseRepository phaseRepository,
            CurriculumService curriculumService,
            CourseService courseService,
            EnrollmentService enrollmentService,
            FhirProperties props
    ) {
        this.topicRepository = topicRepository;
        this.phaseRepository = phaseRepository;
        this.curriculumService = curriculumService;
        this.courseService = courseService;
        this.enrollmentService = enrollmentService;
        this.groqConfig = props.groq();
        this.restClient = RestClient.create();
    }

    @Transactional(readOnly = true)
    public AssistantAskResponse ask(AssistantAskRequest req) {
        if (groqConfig == null || groqConfig.apiKey() == null || groqConfig.apiKey().isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Assistant is not configured (missing GROQ_API_KEY)");
        }

        String screenContext = switch (req.contextType()) {
            case "topic" -> req.contextId() == null ? "" : buildTopicContext(req.contextId());
            case "phase" -> req.contextId() == null ? "" : buildPhaseContext(req.contextId());
            default -> "";
        };
        String progressContext = buildProgressContext();
        String context = (progressContext + "\n" + screenContext).trim();

        String userContent = context.isBlank()
                ? req.question()
                : "Course material:\n" + context + "\n\nQuestion: " + req.question();

        GroqMessage[] messages = {
                new GroqMessage("system", SYSTEM_PROMPT),
                new GroqMessage("user", userContent),
        };
        GroqRequest body = new GroqRequest(groqConfig.model(), messages, 0.3, 700);

        try {
            GroqResponse response = restClient.post()
                    .uri(groqConfig.baseUrl() + "/chat/completions")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + groqConfig.apiKey())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(GroqResponse.class);

            if (response == null || response.choices() == null || response.choices().isEmpty()) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Assistant returned no answer");
            }
            return new AssistantAskResponse(response.choices().get(0).message().content());
        } catch (RestClientException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Assistant request failed: " + e.getMessage(), e);
        }
    }

    private String buildProgressContext() {
        StringBuilder sb = new StringBuilder();
        CurriculumSummaryDto summary = curriculumService.summary();
        sb.append("Learner progress: ").append(summary.percentComplete()).append("% complete overall (")
                .append(summary.topicDone()).append(" of ").append(summary.topicCount()).append(" topics, ")
                .append(summary.phasesCompleted()).append(" of ").append(summary.phaseCount()).append(" phases finished).\n");

        List<EnrollmentDto> mine = enrollmentService.mine();
        if (mine.isEmpty()) {
            sb.append("Not enrolled in any course pathway yet.\n");
        } else {
            Map<String, CourseSummaryDto> courses = courseService.list(null, null).stream()
                    .collect(java.util.stream.Collectors.toMap(CourseSummaryDto::slug, java.util.function.Function.identity()));
            sb.append("Enrolled courses:\n");
            for (EnrollmentDto enrollment : mine) {
                CourseSummaryDto course = courses.get(enrollment.slug());
                String title = course != null ? course.title() : enrollment.slug();
                int percent = course != null ? course.percentComplete() : 0;
                sb.append("- ").append(title).append(": ").append(percent).append("% complete")
                        .append(enrollment.completed() ? " (certificate issued)" : "").append('\n');
            }
        }
        return sb.toString();
    }

    private String buildTopicContext(long topicId) {
        Topic topic = topicRepository.findById(topicId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Topic not found"));

        StringBuilder sb = new StringBuilder();
        sb.append("Topic: ").append(topic.getTitle()).append('\n');
        if (topic.getSummary() != null) sb.append("Summary: ").append(topic.getSummary()).append('\n');
        if (topic.getExamTip() != null) sb.append("Exam tip: ").append(topic.getExamTip()).append('\n');
        if (!topic.getKeyPoints().isEmpty()) {
            sb.append("Key points:\n");
            topic.getKeyPoints().forEach(kp -> sb.append("- ").append(kp.getBody()).append('\n'));
        }
        for (Slide slide : topic.getSlides()) {
            sb.append("\n## ").append(slide.getTitle()).append('\n');
            sb.append(stripHtml(slide.getBodyHtml())).append('\n');
        }
        return sb.toString();
    }

    private String buildPhaseContext(long phaseId) {
        Phase phase = phaseRepository.findById((short) phaseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Phase not found"));

        StringBuilder sb = new StringBuilder();
        sb.append("Phase: ").append(phase.getTitle()).append('\n');
        if (phase.getDescription() != null) sb.append("Description: ").append(phase.getDescription()).append('\n');
        if (!phase.getObjectives().isEmpty()) {
            sb.append("Objectives:\n");
            phase.getObjectives().forEach(o -> sb.append("- ").append(o).append('\n'));
        }
        for (Section section : phase.getSections()) {
            sb.append("\n### ").append(section.getTitle()).append('\n');
            for (Topic topic : section.getTopics()) {
                sb.append("- ").append(topic.getTitle());
                if (topic.getSummary() != null) sb.append(": ").append(topic.getSummary());
                sb.append('\n');
            }
        }
        return sb.toString();
    }

    private static String stripHtml(String html) {
        if (html == null) return "";
        return html.replaceAll("<[^>]+>", " ").replaceAll("\\s+", " ").trim();
    }

    private record GroqMessage(String role, String content) {}

    private record GroqRequest(String model, GroqMessage[] messages, double temperature, int max_tokens) {}

    private record GroqResponse(List<GroqChoice> choices) {}

    private record GroqChoice(GroqMessage message) {}
}
