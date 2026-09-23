package com.fhi.fhirlearning.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.fhi.fhirlearning.domain.learner.Learner;
import com.fhi.fhirlearning.domain.phase.Phase;
import com.fhi.fhirlearning.domain.phase.Section;
import com.fhi.fhirlearning.domain.phase.Topic;
import com.fhi.fhirlearning.domain.progress.TopicProgress;
import com.fhi.fhirlearning.repo.LearnerRepository;
import com.fhi.fhirlearning.repo.PhaseRepository;
import com.fhi.fhirlearning.repo.TopicProgressRepository;
import com.fhi.fhirlearning.repo.TopicRepository;
import com.fhi.fhirlearning.security.SecurityUtils;
import com.fhi.fhirlearning.util.TextNormalizer;
import com.fhi.fhirlearning.web.dto.CurriculumDtos.CurriculumSummaryDto;
import com.fhi.fhirlearning.web.dto.CurriculumDtos.ExampleDto;
import com.fhi.fhirlearning.web.dto.CurriculumDtos.LabDto;
import com.fhi.fhirlearning.web.dto.CurriculumDtos.PhaseCardDto;
import com.fhi.fhirlearning.web.dto.CurriculumDtos.PhaseDetailDto;
import com.fhi.fhirlearning.web.dto.CurriculumDtos.PhaseProgressDto;
import com.fhi.fhirlearning.web.dto.CurriculumDtos.PhaseResourcesDto;
import com.fhi.fhirlearning.web.dto.CurriculumDtos.QuizQuestionDto;
import com.fhi.fhirlearning.web.dto.CurriculumDtos.SectionDto;
import com.fhi.fhirlearning.web.dto.CurriculumDtos.SlideDto;
import com.fhi.fhirlearning.web.dto.CurriculumDtos.SpecDto;
import com.fhi.fhirlearning.web.dto.CurriculumDtos.TopicDetailDto;
import com.fhi.fhirlearning.web.dto.CurriculumDtos.TopicSummaryDto;
import com.fhi.fhirlearning.web.dto.CurriculumDtos.TrackSummaryDto;

@Service
public class CurriculumService {

    private final PhaseRepository phaseRepository;
    private final TopicRepository topicRepository;
    private final TopicProgressRepository progressRepository;
    private final LearnerRepository learnerRepository;

    public CurriculumService(
            PhaseRepository phaseRepository,
            TopicRepository topicRepository,
            TopicProgressRepository progressRepository,
            LearnerRepository learnerRepository
    ) {
        this.phaseRepository = phaseRepository;
        this.topicRepository = topicRepository;
        this.progressRepository = progressRepository;
        this.learnerRepository = learnerRepository;
    }

    @Transactional(readOnly = true)
    public CurriculumSummaryDto summary() {
        List<Phase> phases = phaseRepository.findAllByOrderBySortOrderAsc();
        Map<String, Integer> tracks = new HashMap<>();
        int topics = 0;
        for (Phase p : phases) {
            tracks.merge(p.getTrack(), 1, Integer::sum);
            for (Section s : p.getSections()) {
                topics += s.getTopics().size();
            }
        }

        UUID learnerId = SecurityUtils.requireLearnerId();
        Map<Short, Long> doneByPhase = new HashMap<>();
        for (Object[] row : progressRepository.countCompletedGroupedByPhase(learnerId)) {
            short phaseId = ((Number) row[0]).shortValue();
            long done = ((Number) row[1]).longValue();
            doneByPhase.put(phaseId, done);
        }

        int topicDone = doneByPhase.values().stream().mapToInt(Long::intValue).sum();
        int percentComplete = topics == 0 ? 0 : Math.round(topicDone * 100f / topics);
        int phasesCompleted = 0;
        for (Phase p : phases) {
            int phaseTopics = p.getSections().stream().mapToInt(s -> s.getTopics().size()).sum();
            int phaseDone = doneByPhase.getOrDefault(p.getId(), 0L).intValue();
            if (phaseTopics > 0 && phaseDone >= phaseTopics) {
                phasesCompleted++;
            }
        }

        List<TrackSummaryDto> trackDtos = tracks.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(e -> new TrackSummaryDto(e.getKey(), e.getValue()))
                .toList();
        return new CurriculumSummaryDto(
                phases.size(), topics, topicDone, percentComplete, phasesCompleted, trackDtos
        );
    }

    @Transactional(readOnly = true)
    public List<PhaseCardDto> listPhases(String track, String q) {
        List<Phase> phases = (track == null || track.isBlank() || "All tracks".equalsIgnoreCase(track))
                ? phaseRepository.findAllByOrderBySortOrderAsc()
                : phaseRepository.findByTrackIgnoreCaseOrderBySortOrderAsc(track.trim());

        UUID learnerId = SecurityUtils.requireLearnerId();
        Map<Short, Long> doneByPhase = new HashMap<>();
        for (Object[] row : progressRepository.countCompletedGroupedByPhase(learnerId)) {
            short phaseId = ((Number) row[0]).shortValue();
            long done = ((Number) row[1]).longValue();
            doneByPhase.put(phaseId, done);
        }

        String query = q == null ? "" : q.trim().toLowerCase(Locale.ROOT);
        List<PhaseCardDto> cards = new ArrayList<>();
        for (Phase p : phases) {
            int topicCount = p.getSections().stream().mapToInt(s -> s.getTopics().size()).sum();
            int topicDone = doneByPhase.getOrDefault(p.getId(), 0L).intValue();
            int pct = topicCount == 0 ? 0 : Math.round(topicDone * 100f / topicCount);
            boolean completed = topicCount > 0 && topicDone >= topicCount;
            PhaseCardDto card = new PhaseCardDto(
                    p.getId(),
                    TextNormalizer.clean(p.getTrack()),
                    TextNormalizer.clean(p.getTitle()),
                    TextNormalizer.clean(p.getDescription()),
                    TextNormalizer.clean(p.getDuration()),
                    topicCount, p.getSections().size(), topicDone, pct, completed
            );
            if (query.isEmpty() || matches(p, query)) {
                cards.add(card);
            }
        }
        return cards;
    }

    private boolean matches(Phase p, String q) {
        String blob = (p.getTitle() + " " + p.getDescription() + " " + p.getTrack()).toLowerCase(Locale.ROOT);
        if (blob.contains(q)) return true;
        for (Section s : p.getSections()) {
            if (s.getTitle().toLowerCase(Locale.ROOT).contains(q)) return true;
            for (Topic t : s.getTopics()) {
                if (t.getTitle().toLowerCase(Locale.ROOT).contains(q)) return true;
                if (t.getSummary() != null && t.getSummary().toLowerCase(Locale.ROOT).contains(q)) return true;
            }
        }
        return false;
    }

    @Transactional(readOnly = true)
    public PhaseDetailDto getPhase(short id) {
        Phase phase = phaseRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Phase not found: " + id));
        UUID learnerId = SecurityUtils.requireLearnerId();
        Set<Long> doneIds = progressRepository.findCompletedForPhase(learnerId, id).stream()
                .map(tp -> tp.getTopic().getId())
                .collect(Collectors.toCollection(HashSet::new));

        List<SectionDto> sections = new ArrayList<>();
        int total = 0;
        int done = 0;
        for (Section s : phase.getSections()) {
            List<TopicSummaryDto> topics = new ArrayList<>();
            for (Topic t : s.getTopics()) {
                total++;
                boolean completed = doneIds.contains(t.getId());
                if (completed) done++;
                topics.add(new TopicSummaryDto(
                        t.getId(),
                        TextNormalizer.clean(t.getTitle()),
                        TextNormalizer.clean(t.getSummary()),
                        t.getLegacyKey(),
                        t.getSlides().size(), completed
                ));
            }
            sections.add(new SectionDto(
                    s.getId(),
                    TextNormalizer.clean(s.getTitle()),
                    s.getSortOrder(),
                    topics
            ));
        }

        int pct = total == 0 ? 0 : Math.round(done * 100f / total);
        return new PhaseDetailDto(
                phase.getId(),
                TextNormalizer.clean(phase.getTrack()),
                TextNormalizer.clean(phase.getTitle()),
                TextNormalizer.clean(phase.getDescription()),
                TextNormalizer.clean(phase.getDuration()),
                phase.getObjectives().stream().map(TextNormalizer::clean).toList(),
                phase.getOutcomes().stream().map(TextNormalizer::clean).toList(),
                total, done, pct, sections, toResources(phase)
        );
    }

    private PhaseResourcesDto toResources(Phase phase) {
        List<SpecDto> specs = phase.getSpecs().stream()
                .map(s -> new SpecDto(
                        TextNormalizer.clean(s.getLabel()),
                        s.getUrl(),
                        TextNormalizer.clean(s.getNote())
                ))
                .toList();
        List<ExampleDto> examples = phase.getExamples().stream()
                .map(e -> new ExampleDto(
                        TextNormalizer.clean(e.getTitle()),
                        TextNormalizer.clean(e.getBody())
                ))
                .toList();
        LabDto lab = phase.getLab() == null ? null : new LabDto(
                TextNormalizer.clean(phase.getLab().getTitle()),
                TextNormalizer.clean(phase.getLab().getBody())
        );
        List<QuizQuestionDto> quiz = phase.getQuizQuestions().stream()
                .map(q -> new QuizQuestionDto(
                        q.getId(),
                        TextNormalizer.clean(q.getPrompt()),
                        q.getChoices().stream().map(c -> TextNormalizer.clean(c.getBody())).toList(),
                        q.getAnswerIndex(),
                        TextNormalizer.clean(q.getExplanation())
                ))
                .toList();
        return new PhaseResourcesDto(specs, examples, lab, quiz);
    }

    @Transactional(readOnly = true)
    public TopicDetailDto getTopic(long topicId) {
        Topic topic = topicRepository.findById(topicId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Topic not found"));
        boolean completed = progressRepository.findById(
                new TopicProgress.TopicProgressId(SecurityUtils.requireLearnerId(), topicId)
        ).map(TopicProgress::isCompleted).orElse(false);

        List<SlideDto> slides = topic.getSlides().stream()
                .map(s -> new SlideDto(
                        s.getId(),
                        TextNormalizer.clean(s.getTitle()),
                        TextNormalizer.clean(s.getBodyHtml()),
                        s.getSortOrder()
                ))
                .toList();
        List<String> keyPoints = topic.getKeyPoints().stream()
                .map(k -> TextNormalizer.clean(k.getBody()))
                .toList();

        return new TopicDetailDto(
                topic.getId(),
                TextNormalizer.clean(topic.getTitle()),
                TextNormalizer.clean(topic.getSummary()),
                TextNormalizer.clean(topic.getDetailHtml()),
                TextNormalizer.clean(topic.getExamTip()),
                topic.getLegacyKey(),
                keyPoints,
                slides,
                completed
        );
    }

    @Transactional(readOnly = true)
    public PhaseProgressDto getPhaseProgress(short phaseId) {
        Phase phase = phaseRepository.findById(phaseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Phase not found"));
        List<TopicProgress> completed = progressRepository.findCompletedForPhase(SecurityUtils.requireLearnerId(), phaseId);
        Set<Long> doneIds = completed.stream().map(tp -> tp.getTopic().getId()).collect(Collectors.toSet());
        int total = phase.getSections().stream().mapToInt(s -> s.getTopics().size()).sum();
        int done = doneIds.size();
        int pct = total == 0 ? 0 : Math.round(done * 100f / total);
        List<String> legacyKeys = completed.stream().map(tp -> tp.getTopic().getLegacyKey()).sorted().toList();
        return new PhaseProgressDto(phaseId, total, done, pct, legacyKeys, doneIds.stream().sorted().toList());
    }

    @Transactional
    public PhaseProgressDto setTopicProgress(long topicId, boolean completed) {
        Topic topic = topicRepository.findById(topicId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Topic not found"));
        Learner learner = learnerRepository.findById(SecurityUtils.requireLearnerId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Learner not found"));

        TopicProgress.TopicProgressId id = new TopicProgress.TopicProgressId(learner.getId(), topicId);
        if (completed) {
            TopicProgress tp = progressRepository.findById(id).orElseGet(TopicProgress::new);
            tp.setLearner(learner);
            tp.setTopic(topic);
            tp.setCompleted(true);
            tp.setCompletedAt(java.time.Instant.now());
            progressRepository.save(tp);
        } else {
            progressRepository.deleteById(id);
        }
        return getPhaseProgress(topic.getSection().getPhase().getId());
    }
}
