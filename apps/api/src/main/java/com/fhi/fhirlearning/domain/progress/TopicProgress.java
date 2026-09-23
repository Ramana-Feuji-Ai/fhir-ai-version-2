package com.fhi.fhirlearning.domain.progress;

import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

import com.fhi.fhirlearning.domain.learner.Learner;
import com.fhi.fhirlearning.domain.phase.Topic;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;

@Entity
@Table(name = "topic_progress")
public class TopicProgress {

    @EmbeddedId
    private TopicProgressId id = new TopicProgressId();

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("learnerId")
    @JoinColumn(name = "learner_id")
    private Learner learner;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId("topicId")
    @JoinColumn(name = "topic_id")
    private Topic topic;

    @Column(nullable = false)
    private boolean completed = true;

    @Column(name = "completed_at", nullable = false)
    private Instant completedAt = Instant.now();

    public TopicProgressId getId() { return id; }
    public Learner getLearner() { return learner; }
    public void setLearner(Learner learner) { this.learner = learner; }
    public Topic getTopic() { return topic; }
    public void setTopic(Topic topic) { this.topic = topic; }
    public boolean isCompleted() { return completed; }
    public void setCompleted(boolean completed) { this.completed = completed; }
    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }

    @Embeddable
    public static class TopicProgressId implements Serializable {
        @Column(name = "learner_id")
        private UUID learnerId;
        @Column(name = "topic_id")
        private Long topicId;

        public TopicProgressId() {}
        public TopicProgressId(UUID learnerId, Long topicId) {
            this.learnerId = learnerId;
            this.topicId = topicId;
        }

        public UUID getLearnerId() { return learnerId; }
        public void setLearnerId(UUID learnerId) { this.learnerId = learnerId; }
        public Long getTopicId() { return topicId; }
        public void setTopicId(Long topicId) { this.topicId = topicId; }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof TopicProgressId that)) return false;
            return Objects.equals(learnerId, that.learnerId) && Objects.equals(topicId, that.topicId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(learnerId, topicId);
        }
    }
}
