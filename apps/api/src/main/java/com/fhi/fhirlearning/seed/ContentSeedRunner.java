package com.fhi.fhirlearning.seed;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fhi.fhirlearning.config.FhirProperties;
import com.fhi.fhirlearning.domain.phase.Phase;
import com.fhi.fhirlearning.domain.phase.PhaseExample;
import com.fhi.fhirlearning.domain.phase.PhaseLab;
import com.fhi.fhirlearning.domain.phase.PhaseSpec;
import com.fhi.fhirlearning.domain.phase.QuizChoice;
import com.fhi.fhirlearning.domain.phase.QuizQuestion;
import com.fhi.fhirlearning.domain.phase.Section;
import com.fhi.fhirlearning.domain.phase.Slide;
import com.fhi.fhirlearning.domain.phase.Topic;
import com.fhi.fhirlearning.domain.phase.TopicKeyPoint;
import com.fhi.fhirlearning.util.TextNormalizer;
import com.fhi.fhirlearning.repo.PhaseRepository;

/**
 * Loads SPA-extracted {@code phases.spa.json} when the phase table is empty.
 */
@Component
public class ContentSeedRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(ContentSeedRunner.class);

    private final PhaseRepository phaseRepository;
    private final FhirProperties props;
    private final ObjectMapper mapper;

    public ContentSeedRunner(PhaseRepository phaseRepository, FhirProperties props, ObjectMapper mapper) {
        this.phaseRepository = phaseRepository;
        this.props = props;
        this.mapper = mapper;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) throws Exception {
        if (!props.seed().enabled()) {
            log.info("Content seed disabled");
            return;
        }
        if (phaseRepository.count() > 0) {
            log.info("Phases already present ({}); skipping seed", phaseRepository.count());
            return;
        }

        byte[] json = readSeedBytes();
        JsonNode root = mapper.readTree(json);
        if (!root.isArray()) {
            throw new IllegalStateException("phases.spa.json must be a JSON array");
        }

        int topics = 0;
        int slides = 0;
        List<Phase> batch = new ArrayList<>();
        for (JsonNode node : root) {
            Phase phase = mapPhase(node);
            topics += phase.getSections().stream().mapToInt(s -> s.getTopics().size()).sum();
            slides += phase.getSections().stream()
                    .flatMap(s -> s.getTopics().stream())
                    .mapToInt(t -> t.getSlides().size())
                    .sum();
            batch.add(phase);
        }
        phaseRepository.saveAll(batch);
        log.info("Seeded {} phases, {} topics, {} slides from SPA content", batch.size(), topics, slides);
    }

    private byte[] readSeedBytes() throws IOException {
        Path configured = Paths.get(props.seed().phasesJson()).toAbsolutePath().normalize();
        if (Files.isRegularFile(configured)) {
            log.info("Seeding from {}", configured);
            return Files.readAllBytes(configured);
        }
        // Fallbacks relative to api working directory / classpath
        Path[] candidates = new Path[] {
                Paths.get("data/phases.spa.json").toAbsolutePath(),
                Paths.get("../data/phases.spa.json").toAbsolutePath(),
                Paths.get("../../data/phases.spa.json").toAbsolutePath()
        };
        for (Path p : candidates) {
            if (Files.isRegularFile(p)) {
                log.info("Seeding from {}", p);
                return Files.readAllBytes(p);
            }
        }
        ClassPathResource cp = new ClassPathResource("db/seed/phases.spa.json");
        if (cp.exists()) {
            log.info("Seeding from classpath db/seed/phases.spa.json");
            return cp.getInputStream().readAllBytes();
        }
        throw new IllegalStateException(
                "Could not find phases.spa.json. Set fhir.seed.phases-json to absolute path. Tried: " + configured);
    }

    private Phase mapPhase(JsonNode n) {
        Phase phase = new Phase();
        phase.setId((short) n.path("id").asInt());
        phase.setTrack(text(n, "track"));
        phase.setTitle(text(n, "title"));
        phase.setDescription(text(n, "description"));
        phase.setDuration(text(n, "duration"));
        phase.setSortOrder(phase.getId());
        phase.setObjectives(stringList(n.get("objectives")));
        phase.setOutcomes(stringList(n.get("outcomes")));

        JsonNode sections = n.get("sections");
        if (sections != null && sections.isArray()) {
            short si = 0;
            for (JsonNode secNode : sections) {
                // SPA shape: [sectionTitle, topics[]]
                Section section = new Section();
                section.setTitle(textNode(secNode.get(0)));
                section.setSortOrder(si);
                JsonNode topics = secNode.get(1);
                if (topics != null && topics.isArray()) {
                    short ti = 0;
                    for (JsonNode tNode : topics) {
                        section.addTopic(mapTopic(tNode, si, ti));
                        ti++;
                    }
                }
                phase.addSection(section);
                si++;
            }
        }

        JsonNode resources = n.get("resources");
        if (resources != null && !resources.isNull()) {
            mapResources(phase, resources);
        }
        return phase;
    }

    private Topic mapTopic(JsonNode tNode, short sectionIndex, short topicIndex) {
        Topic topic = new Topic();
        topic.setLegacyKey(sectionIndex + "-" + topicIndex);
        topic.setSortOrder(topicIndex);

        if (tNode.isTextual()) {
            topic.setTitle(textNode(tNode));
            return topic;
        }

        topic.setTitle(text(tNode, "title"));
        topic.setSummary(nullableText(tNode, "summary"));
        topic.setDetailHtml(nullableText(tNode, "detail"));
        topic.setExamTip(nullableText(tNode, "examTip"));

        short kpi = 0;
        for (String kp : stringList(tNode.get("keyPoints"))) {
            TopicKeyPoint point = new TopicKeyPoint();
            point.setSortOrder(kpi++);
            point.setBody(kp);
            topic.addKeyPoint(point);
        }

        JsonNode slides = tNode.get("slides");
        if (slides != null && slides.isArray()) {
            short sli = 0;
            for (JsonNode s : slides) {
                Slide slide = new Slide();
                slide.setSortOrder(sli++);
                slide.setTitle(text(s, "title"));
                slide.setBodyHtml(text(s, "body"));
                topic.addSlide(slide);
            }
        }
        return topic;
    }

    private void mapResources(Phase phase, JsonNode resources) {
        JsonNode specs = resources.get("specs");
        if (specs != null && specs.isArray()) {
            short i = 0;
            for (JsonNode s : specs) {
                PhaseSpec spec = new PhaseSpec();
                spec.setPhase(phase);
                spec.setSortOrder(i++);
                spec.setLabel(text(s, "label"));
                spec.setUrl(text(s, "url"));
                spec.setNote(nullableText(s, "note"));
                phase.getSpecs().add(spec);
            }
        }

        JsonNode examples = resources.get("examples");
        if (examples != null && examples.isArray()) {
            short i = 0;
            for (JsonNode e : examples) {
                PhaseExample ex = new PhaseExample();
                ex.setPhase(phase);
                ex.setSortOrder(i++);
                ex.setTitle(text(e, "title"));
                ex.setBody(text(e, "body"));
                phase.getExamples().add(ex);
            }
        }

        JsonNode labNode = resources.get("lab");
        if (labNode != null && !labNode.isNull()) {
            PhaseLab lab = new PhaseLab();
            lab.setPhase(phase);
            lab.setTitle(text(labNode, "title"));
            lab.setBody(text(labNode, "body"));
            phase.setLab(lab);
        }

        JsonNode quiz = resources.get("quiz");
        if (quiz != null && quiz.isArray()) {
            short qi = 0;
            for (JsonNode q : quiz) {
                QuizQuestion question = new QuizQuestion();
                question.setPhase(phase);
                question.setSortOrder(qi++);
                question.setPrompt(text(q, "q"));
                question.setAnswerIndex((short) q.path("answer").asInt());
                question.setExplanation(text(q, "why"));
                JsonNode choices = q.get("choices");
                if (choices != null && choices.isArray()) {
                    short ci = 0;
                    for (JsonNode c : choices) {
                        QuizChoice choice = new QuizChoice();
                        choice.setSortOrder(ci++);
                        choice.setBody(textNode(c));
                        question.addChoice(choice);
                    }
                }
                phase.getQuizQuestions().add(question);
            }
        }
    }

    private static String text(JsonNode n, String field) {
        JsonNode v = n.get(field);
        return v == null || v.isNull() ? "" : textNode(v);
    }

    private static String nullableText(JsonNode n, String field) {
        JsonNode v = n.get(field);
        return v == null || v.isNull() ? null : textNode(v);
    }

    private static String textNode(JsonNode v) {
        return TextNormalizer.clean(v.asText());
    }

    private static List<String> stringList(JsonNode node) {
        List<String> list = new ArrayList<>();
        if (node == null || !node.isArray()) return list;
        for (Iterator<JsonNode> it = node.elements(); it.hasNext(); ) {
            list.add(textNode(it.next()));
        }
        return list;
    }
}
