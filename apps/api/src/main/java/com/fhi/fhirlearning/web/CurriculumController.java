package com.fhi.fhirlearning.web;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.fhi.fhirlearning.service.CurriculumService;
import com.fhi.fhirlearning.web.dto.CurriculumDtos.CurriculumSummaryDto;
import com.fhi.fhirlearning.web.dto.CurriculumDtos.PhaseCardDto;
import com.fhi.fhirlearning.web.dto.CurriculumDtos.PhaseDetailDto;
import com.fhi.fhirlearning.web.dto.CurriculumDtos.PhaseProgressDto;
import com.fhi.fhirlearning.web.dto.CurriculumDtos.TopicDetailDto;
import com.fhi.fhirlearning.web.dto.CurriculumDtos.TopicProgressRequest;
import com.fhi.fhirlearning.web.dto.CurriculumDtos.TrackSummaryDto;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1")
public class CurriculumController {

    private final CurriculumService curriculumService;

    public CurriculumController(CurriculumService curriculumService) {
        this.curriculumService = curriculumService;
    }

    /** Home pathway stats + track chips. */
    @GetMapping("/curriculum/summary")
    public CurriculumSummaryDto summary() {
        return curriculumService.summary();
    }

    @GetMapping("/tracks")
    public List<TrackSummaryDto> tracks() {
        return curriculumService.summary().tracks();
    }

    /** Curriculum catalog cards (SPA filterCards / phaseCards). */
    @GetMapping("/phases")
    public List<PhaseCardDto> phases(
            @RequestParam(required = false) String track,
            @RequestParam(required = false) String q
    ) {
        return curriculumService.listPhases(track, q);
    }

    /** Phase page: hero, tree, resources (topic rows without slide bodies). */
    @GetMapping("/phases/{id}")
    public PhaseDetailDto phase(@PathVariable short id) {
        return curriculumService.getPhase(id);
    }

    /** Lazy-load slide deck when a topic row is opened. */
    @GetMapping("/topics/{id}")
    public TopicDetailDto topic(@PathVariable long id) {
        return curriculumService.getTopic(id);
    }

    /** Replaces localStorage `fhi-phase-{id}`. */
    @GetMapping("/me/progress/phases/{phaseId}")
    public PhaseProgressDto phaseProgress(@PathVariable short phaseId) {
        return curriculumService.getPhaseProgress(phaseId);
    }

    /** Toggle topic complete (SPA toggleTopic). */
    @PutMapping("/me/progress/topics/{topicId}")
    public PhaseProgressDto setTopicProgress(
            @PathVariable long topicId,
            @Valid @RequestBody TopicProgressRequest body
    ) {
        return curriculumService.setTopicProgress(topicId, body.completed());
    }
}
