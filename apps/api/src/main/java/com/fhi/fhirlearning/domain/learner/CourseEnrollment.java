package com.fhi.fhirlearning.domain.learner;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "course_enrollment", uniqueConstraints = @UniqueConstraint(columnNames = {"learner_id", "course_slug"}))
public class CourseEnrollment {
    @Id @GeneratedValue private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "learner_id", nullable = false) private Learner learner;
    @Column(name = "course_slug", nullable = false, length = 80) private String courseSlug;
    @Column(name = "enrolled_at", nullable = false) private Instant enrolledAt = Instant.now();
    @Column(name = "completed_at") private Instant completedAt;
    public UUID getId() { return id; }
    public Learner getLearner() { return learner; }
    public void setLearner(Learner learner) { this.learner = learner; }
    public String getCourseSlug() { return courseSlug; }
    public void setCourseSlug(String courseSlug) { this.courseSlug = courseSlug; }
    public Instant getEnrolledAt() { return enrolledAt; }
    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }
}