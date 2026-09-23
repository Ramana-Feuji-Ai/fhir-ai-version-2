package com.fhi.fhirlearning.repo;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.fhi.fhirlearning.domain.learner.Learner;

public interface LearnerRepository extends JpaRepository<Learner, UUID> {

    Optional<Learner> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);
}
