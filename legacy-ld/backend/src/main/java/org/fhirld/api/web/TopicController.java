package org.fhirld.api.web;

import java.util.Arrays;
import java.util.List;

import org.fhirld.api.domain.QuizItem;
import org.fhirld.api.domain.Topic;
import org.fhirld.api.repo.QuizItemRepository;
import org.fhirld.api.repo.TopicRepository;
import org.fhirld.api.web.dto.Dtos.LineDto;
import org.fhirld.api.web.dto.Dtos.QuizCheckRequest;
import org.fhirld.api.web.dto.Dtos.QuizCheckResponse;
import org.fhirld.api.web.dto.Dtos.QuizPublicDto;
import org.fhirld.api.web.dto.Dtos.SectionDto;
import org.fhirld.api.web.dto.Dtos.TopicDetailDto;
import org.fhirld.api.web.dto.Dtos.TopicSummaryDto;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/api")
@Transactional(readOnly = true)
public class TopicController {

    private final TopicRepository topics;
    private final QuizItemRepository quizItems;
    private final ObjectMapper mapper;

    public TopicController(TopicRepository topics, QuizItemRepository quizItems, ObjectMapper mapper) {
        this.topics = topics;
        this.quizItems = quizItems;
        this.mapper = mapper;
    }

    @GetMapping("/topics")
    public List<TopicSummaryDto> list() {
        return topics.findAllByOrderBySortOrderAsc().stream().map(this::toSummary).toList();
    }

    @GetMapping("/topics/{slug}")
    public ResponseEntity<TopicDetailDto> one(@PathVariable String slug) {
        return topics.findBySlug(slug).map(this::toDetail).map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/quiz/{id}/check")
    public ResponseEntity<QuizCheckResponse> check(@PathVariable Long id, @RequestBody QuizCheckRequest body) {
        return quizItems.findById(id)
                .map(item -> ResponseEntity.ok(new QuizCheckResponse(
                        body.selectedIndex() == item.getAnswerIndex(),
                        item.getExplanation(),
                        item.getAnswerIndex())))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    private TopicSummaryDto toSummary(Topic t) {
        return new TopicSummaryDto(t.getSlug(), t.getTitle(), t.getKicker(), t.getDurationHint(), t.getPhase(),
                t.getSummary(), t.getInteractiveType());
    }

    private TopicDetailDto toDetail(Topic t) {
        Object interactive = parseJson(t.getInteractiveJson());
        List<String> refs = t.getReferencesCsv() == null || t.getReferencesCsv().isBlank()
                ? List.of()
                : Arrays.stream(t.getReferencesCsv().split("\\|")).map(String::trim).toList();
        return new TopicDetailDto(
                t.getSlug(),
                t.getTitle(),
                t.getKicker(),
                t.getDurationHint(),
                t.getPhase(),
                t.getSummary(),
                refs,
                t.getInteractiveType(),
                interactive,
                t.getSections().stream().map(s -> new SectionDto(s.getHeading(), s.getBody())).toList(),
                t.getLines().stream().map(l -> new LineDto(l.getSpeaker(), l.getSpeakerName(), l.getSpeakerRole(),
                        l.getText(), l.getAudioPath())).toList(),
                t.getQuiz().stream().map(q -> new QuizPublicDto(q.getId(), q.getPrompt(), parseOptions(q.getOptionsJson())))
                        .toList());
    }

    private List<String> parseOptions(String json) {
        try {
            return mapper.readValue(json, new TypeReference<List<String>>() {
            });
        } catch (JsonProcessingException e) {
            return List.of();
        }
    }

    private Object parseJson(String json) {
        if (json == null || json.isBlank()) {
            return null;
        }
        try {
            return mapper.readTree(json);
        } catch (JsonProcessingException e) {
            return json;
        }
    }
}
