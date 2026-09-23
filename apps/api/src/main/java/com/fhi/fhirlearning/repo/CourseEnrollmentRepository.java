package com.fhi.fhirlearning.repo;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.fhi.fhirlearning.domain.learner.CourseEnrollment;

public interface CourseEnrollmentRepository extends JpaRepository<CourseEnrollment, UUID> {
    Optional<CourseEnrollment> findByLearnerIdAndCourseSlug(UUID learnerId, String courseSlug);
    List<CourseEnrollment> findByLearnerIdOrderByEnrolledAtDesc(UUID learnerId);
}