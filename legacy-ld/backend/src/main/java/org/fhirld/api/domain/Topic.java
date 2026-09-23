package org.fhirld.api.domain;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;

@Entity
@Table(name = "topics")
public class Topic {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String slug;

    @Column(nullable = false)
    private String title;

    private String kicker;
    private String durationHint;
    private int phase;
    private int sortOrder;

    @Column(columnDefinition = "TEXT")
    private String summary;

    @Column(columnDefinition = "TEXT")
    private String referencesCsv;

    private String interactiveType;

    @Column(columnDefinition = "TEXT")
    private String interactiveJson;

    @OneToMany(mappedBy = "topic", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    private List<LessonSection> sections = new ArrayList<>();

    @OneToMany(mappedBy = "topic", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    private List<ConversationLine> lines = new ArrayList<>();

    @OneToMany(mappedBy = "topic", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    private List<QuizItem> quiz = new ArrayList<>();

    public Long getId() {
        return id;
    }

    public String getSlug() {
        return slug;
    }

    public void setSlug(String slug) {
        this.slug = slug;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getKicker() {
        return kicker;
    }

    public void setKicker(String kicker) {
        this.kicker = kicker;
    }

    public String getDurationHint() {
        return durationHint;
    }

    public void setDurationHint(String durationHint) {
        this.durationHint = durationHint;
    }

    public int getPhase() {
        return phase;
    }

    public void setPhase(int phase) {
        this.phase = phase;
    }

    public int getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(int sortOrder) {
        this.sortOrder = sortOrder;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public String getReferencesCsv() {
        return referencesCsv;
    }

    public void setReferencesCsv(String referencesCsv) {
        this.referencesCsv = referencesCsv;
    }

    public String getInteractiveType() {
        return interactiveType;
    }

    public void setInteractiveType(String interactiveType) {
        this.interactiveType = interactiveType;
    }

    public String getInteractiveJson() {
        return interactiveJson;
    }

    public void setInteractiveJson(String interactiveJson) {
        this.interactiveJson = interactiveJson;
    }

    public List<LessonSection> getSections() {
        return sections;
    }

    public List<ConversationLine> getLines() {
        return lines;
    }

    public List<QuizItem> getQuiz() {
        return quiz;
    }
}
