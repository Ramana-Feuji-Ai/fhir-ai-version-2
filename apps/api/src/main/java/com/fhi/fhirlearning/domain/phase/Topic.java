package com.fhi.fhirlearning.domain.phase;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;

@Entity
@Table(name = "topic")
public class Topic {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "section_id", nullable = false)
    private Section section;

    @Column(nullable = false, length = 512)
    private String title;

    @Column(columnDefinition = "text")
    private String summary;

    @Column(name = "detail_html", columnDefinition = "text")
    private String detailHtml;

    @Column(name = "exam_tip", columnDefinition = "text")
    private String examTip;

    @Column(name = "sort_order", nullable = false)
    private short sortOrder;

    @Column(name = "legacy_key", nullable = false, length = 32)
    private String legacyKey;

    @OneToMany(mappedBy = "topic", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    private List<TopicKeyPoint> keyPoints = new ArrayList<>();

    @OneToMany(mappedBy = "topic", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    private List<Slide> slides = new ArrayList<>();

    public Long getId() { return id; }
    public Section getSection() { return section; }
    public void setSection(Section section) { this.section = section; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }
    public String getDetailHtml() { return detailHtml; }
    public void setDetailHtml(String detailHtml) { this.detailHtml = detailHtml; }
    public String getExamTip() { return examTip; }
    public void setExamTip(String examTip) { this.examTip = examTip; }
    public short getSortOrder() { return sortOrder; }
    public void setSortOrder(short sortOrder) { this.sortOrder = sortOrder; }
    public String getLegacyKey() { return legacyKey; }
    public void setLegacyKey(String legacyKey) { this.legacyKey = legacyKey; }
    public List<TopicKeyPoint> getKeyPoints() { return keyPoints; }
    public List<Slide> getSlides() { return slides; }

    public void addKeyPoint(TopicKeyPoint kp) {
        keyPoints.add(kp);
        kp.setTopic(this);
    }

    public void addSlide(Slide slide) {
        slides.add(slide);
        slide.setTopic(this);
    }
}
