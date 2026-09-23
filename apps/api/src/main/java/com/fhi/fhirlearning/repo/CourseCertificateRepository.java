package com.fhi.fhirlearning.repo;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.fhi.fhirlearning.domain.learner.CourseCertificate;

public interface CourseCertificateRepository extends JpaRepository<CourseCertificate, UUID> {
    Optional<CourseCertificate> findByLearnerIdAndCourseSlug(UUID learnerId, String courseSlug);
}