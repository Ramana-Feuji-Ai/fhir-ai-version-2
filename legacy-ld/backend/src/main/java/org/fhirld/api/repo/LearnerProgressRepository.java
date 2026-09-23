package org.fhirld.api.repo;

import java.util.List;
import java.util.Optional;

import org.fhirld.api.domain.LearnerProgress;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LearnerProgressRepository extends JpaRepository<LearnerProgress, Long> {
    List<LearnerProgress> findByLearnerKey(String learnerKey);
    Optional<LearnerProgress> findByLearnerKeyAndTopicSlug(String learnerKey, String topicSlug);
}
