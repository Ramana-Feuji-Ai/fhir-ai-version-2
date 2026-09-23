package com.fhi.fhirlearning.repo;

import org.springframework.data.jpa.repository.JpaRepository;

import com.fhi.fhirlearning.domain.phase.Topic;

public interface TopicRepository extends JpaRepository<Topic, Long> {
}
