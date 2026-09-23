package org.fhirld.api.repo;

import org.fhirld.api.domain.QuizItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuizItemRepository extends JpaRepository<QuizItem, Long> {
}
