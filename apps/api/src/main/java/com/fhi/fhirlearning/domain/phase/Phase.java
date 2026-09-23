package com.fhi.fhirlearning.domain.phase;

import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;

@Entity
@Table(name = "phase")
public class Phase {

    @Id
    private Short id;

    @Column(nullable = false, length = 64)
    private String track;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "text")
    private String description;

    @Column(nullable = false, length = 64)
    private String duration;

    @Column(name = "sort_order", nullable = false)
    private short sortOrder;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private List<String> objectives = new ArrayList<>();

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "jsonb")
    private List<String> outcomes = new ArrayList<>();

    @OneToMany(mappedBy = "phase", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("sortOrder ASC")
    private List<Section> sections = new ArrayList<>();

    @OneToMany(mappedBy = "phase", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("sortOrder ASC")
    private List<PhaseSpec> specs = new ArrayList<>();

    @OneToMany(mappedBy = "phase", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("sortOrder ASC")
    private List<PhaseExample> examples = new ArrayList<>();

    @OneToOne(mappedBy = "phase", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private PhaseLab lab;

    @OneToMany(mappedBy = "phase", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("sortOrder ASC")
    private List<QuizQuestion> quizQuestions = new ArrayList<>();

    public Short getId() { return id; }
    public void setId(Short id) { this.id = id; }
    public String getTrack() { return track; }
    public void setTrack(String track) { this.track = track; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getDuration() { return duration; }
    public void setDuration(String duration) { this.duration = duration; }
    public short getSortOrder() { return sortOrder; }
    public void setSortOrder(short sortOrder) { this.sortOrder = sortOrder; }
    public List<String> getObjectives() { return objectives; }
    public void setObjectives(List<String> objectives) { this.objectives = objectives; }
    public List<String> getOutcomes() { return outcomes; }
    public void setOutcomes(List<String> outcomes) { this.outcomes = outcomes; }
    public List<Section> getSections() { return sections; }
    public List<PhaseSpec> getSpecs() { return specs; }
    public List<PhaseExample> getExamples() { return examples; }
    public PhaseLab getLab() { return lab; }
    public void setLab(PhaseLab lab) { this.lab = lab; }
    public List<QuizQuestion> getQuizQuestions() { return quizQuestions; }

    public void addSection(Section section) {
        sections.add(section);
        section.setPhase(this);
    }
}
