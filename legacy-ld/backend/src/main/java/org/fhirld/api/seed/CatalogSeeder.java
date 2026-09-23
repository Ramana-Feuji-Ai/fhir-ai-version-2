package org.fhirld.api.seed;

import java.io.InputStream;

import org.fhirld.api.domain.ConversationLine;
import org.fhirld.api.domain.LabPatient;
import org.fhirld.api.domain.LessonSection;
import org.fhirld.api.domain.QuizItem;
import org.fhirld.api.domain.Topic;
import org.fhirld.api.repo.LabPatientRepository;
import org.fhirld.api.repo.TopicRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Component
public class CatalogSeeder implements CommandLineRunner {

    private final TopicRepository topics;
    private final LabPatientRepository patients;
    private final ObjectMapper mapper;

    public CatalogSeeder(TopicRepository topics, LabPatientRepository patients, ObjectMapper mapper) {
        this.topics = topics;
        this.patients = patients;
        this.mapper = mapper;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        topics.findAll().forEach(topics::delete);
        topics.flush();
        try (InputStream in = new ClassPathResource("catalog.json").getInputStream()) {
            JsonNode root = mapper.readTree(in);
            int order = 0;
            for (JsonNode node : root.get("topics")) {
                Topic topic = new Topic();
                topic.setSlug(node.get("slug").asText());
                topic.setTitle(node.get("title").asText());
                topic.setKicker(text(node, "kicker"));
                topic.setDurationHint(text(node, "durationHint"));
                topic.setPhase(node.path("phase").asInt(1));
                topic.setSortOrder(order++);
                topic.setSummary(text(node, "summary"));
                topic.setInteractiveType(text(node, "interactiveType"));
                if (node.has("interactive")) {
                    topic.setInteractiveJson(mapper.writeValueAsString(node.get("interactive")));
                }
                if (node.has("references")) {
                    StringBuilder csv = new StringBuilder();
                    for (JsonNode r : node.withArray("references")) {
                        if (!csv.isEmpty()) {
                            csv.append('|');
                        }
                        csv.append(r.asText());
                    }
                    topic.setReferencesCsv(csv.toString());
                }
                int s = 0;
                for (JsonNode sec : node.withArray("sections")) {
                    LessonSection section = new LessonSection();
                    section.setTopic(topic);
                    section.setHeading(text(sec, "heading"));
                    section.setBody(text(sec, "body"));
                    section.setSortOrder(s++);
                    topic.getSections().add(section);
                }
                int l = 0;
                for (JsonNode line : node.withArray("conversation")) {
                    ConversationLine row = new ConversationLine();
                    row.setTopic(topic);
                    row.setSpeaker(text(line, "speaker"));
                    row.setSpeakerName("maya".equals(row.getSpeaker()) ? "Dr. Maya Krishnan" : "Alex Duarte");
                    row.setSpeakerRole("maya".equals(row.getSpeaker()) ? "Clinical informaticist" : "FHIR implementer");
                    row.setText(text(line, "text"));
                    row.setAudioPath(text(line, "audioPath"));
                    row.setSortOrder(l++);
                    topic.getLines().add(row);
                }
                int q = 0;
                for (JsonNode quiz : node.withArray("quiz")) {
                    QuizItem item = new QuizItem();
                    item.setTopic(topic);
                    item.setPrompt(text(quiz, "prompt"));
                    item.setOptionsJson(mapper.writeValueAsString(quiz.get("options")));
                    item.setAnswerIndex(quiz.path("answer").asInt());
                    item.setExplanation(text(quiz, "explanation"));
                    item.setSortOrder(q++);
                    topic.getQuiz().add(item);
                }
                topics.save(topic);
            }
        }
        if (patients.count() == 0) {
            seedLabPatients();
        }
    }

    private void seedLabPatients() throws Exception {
        savePatient("example", "Chalmers", "Peter", "male", "1974-12-25",
                """
                {"resourceType":"Patient","id":"example","text":{"status":"generated","div":"<div>Peter Chalmers</div>"},"identifier":[{"system":"urn:oid:1.2.36.146.595.217.0.1","value":"12345"}],"active":true,"name":[{"use":"official","family":"Chalmers","given":["Peter","James"]}],"telecom":[{"system":"phone","value":"(03) 5555 6473","use":"work"}],"gender":"male","birthDate":"1974-12-25","address":[{"use":"home","line":["534 Erewhon St"],"city":"PleasantVille","state":"Vic","postalCode":"3999"}]}
                """);
        savePatient("pat2", "Levin", "Henry", "male", "1932-09-24",
                """
                {"resourceType":"Patient","id":"pat2","active":true,"name":[{"family":"Levin","given":["Henry"]}],"gender":"male","birthDate":"1932-09-24"}
                """);
    }

    private void savePatient(String id, String family, String given, String gender, String birth, String json) {
        LabPatient p = new LabPatient();
        p.setResourceId(id);
        p.setFamily(family);
        p.setGiven(given);
        p.setGender(gender);
        p.setBirthDate(birth);
        p.setResourceJson(json);
        patients.save(p);
    }

    private static String text(JsonNode node, String field) {
        return node.path(field).asText("");
    }
}
