package org.fhirld.api.repo;

import java.util.List;
import java.util.Optional;

import org.fhirld.api.domain.Topic;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TopicRepository extends JpaRepository<Topic, Long> {
    Optional<Topic> findBySlug(String slug);
    List<Topic> findAllByOrderBySortOrderAsc();
}
