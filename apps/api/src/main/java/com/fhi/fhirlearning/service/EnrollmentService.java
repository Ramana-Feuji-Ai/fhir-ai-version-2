package com.fhi.fhirlearning.service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.fhi.fhirlearning.domain.learner.CourseCertificate;
import com.fhi.fhirlearning.domain.learner.CourseEnrollment;
import com.fhi.fhirlearning.domain.learner.Learner;
import com.fhi.fhirlearning.repo.CourseCertificateRepository;
import com.fhi.fhirlearning.repo.CourseEnrollmentRepository;
import com.fhi.fhirlearning.repo.LearnerRepository;
import com.fhi.fhirlearning.security.SecurityUtils;
import com.fhi.fhirlearning.web.dto.CourseDtos.CourseDetailDto;
import com.fhi.fhirlearning.web.dto.CourseDtos.EnrollmentDto;

@Service
public class EnrollmentService {
    private final CourseEnrollmentRepository enrollments;
    private final CourseCertificateRepository certificates;
    private final LearnerRepository learners;
    private final CourseService courses;

    public EnrollmentService(CourseEnrollmentRepository enrollments, CourseCertificateRepository certificates, LearnerRepository learners, CourseService courses) {
        this.enrollments = enrollments;
        this.certificates = certificates;
        this.learners = learners;
        this.courses = courses;
    }

    @Transactional
    public EnrollmentDto enroll(String slug) {
        UUID learnerId = SecurityUtils.requireLearnerId();
        CourseDetailDto detail = courses.get(slug);
        CourseEnrollment enrollment = enrollments.findByLearnerIdAndCourseSlug(learnerId, slug).orElseGet(() -> {
            Learner learner = learners.findById(learnerId).orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Learner not found"));
            CourseEnrollment created = new CourseEnrollment();
            created.setLearner(learner);
            created.setCourseSlug(slug);
            return enrollments.save(created);
        });
        return sync(enrollment, detail);
    }

    @Transactional(readOnly = true)
    public List<EnrollmentDto> mine() {
        return enrollments.findByLearnerIdOrderByEnrolledAtDesc(SecurityUtils.requireLearnerId()).stream()
                .map(enrollment -> sync(enrollment, courses.get(enrollment.getCourseSlug()))).toList();
    }

    @Transactional
    public EnrollmentDto issueCertificate(String slug) {
        UUID learnerId = SecurityUtils.requireLearnerId();
        CourseEnrollment enrollment = enrollments.findByLearnerIdAndCourseSlug(learnerId, slug)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Course is not enrolled"));
        CourseDetailDto detail = courses.get(slug);
        if (detail.course().percentComplete() < 100) throw new ResponseStatusException(HttpStatus.CONFLICT, "Course is not complete");
        CourseCertificate certificate = certificates.findByLearnerIdAndCourseSlug(learnerId, slug).orElseGet(() -> {
            Learner learner = learners.findById(learnerId).orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Learner not found"));
            CourseCertificate created = new CourseCertificate();
            created.setLearner(learner);
            created.setCourseSlug(slug);
            created.setCertificateNumber("FHIR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
            return certificates.save(created);
        });
        enrollment.setCompletedAt(Instant.now());
        enrollments.save(enrollment);
        return new EnrollmentDto(slug, enrollment.getEnrolledAt().toString(), true, certificate.getCertificateNumber());
    }

    private EnrollmentDto sync(CourseEnrollment enrollment, CourseDetailDto detail) {
        boolean complete = detail.course().percentComplete() == 100;
        return new EnrollmentDto(enrollment.getCourseSlug(), enrollment.getEnrolledAt().toString(), complete, certificates.findByLearnerIdAndCourseSlug(enrollment.getLearner().getId(), enrollment.getCourseSlug()).map(CourseCertificate::getCertificateNumber).orElse(null));
    }
}