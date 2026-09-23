package com.fhi.fhirlearning.web;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.fhi.fhirlearning.service.CourseService;
import com.fhi.fhirlearning.service.EnrollmentService;
import com.fhi.fhirlearning.web.dto.CourseDtos.CourseDetailDto;
import com.fhi.fhirlearning.web.dto.CourseDtos.CourseSummaryDto;
import com.fhi.fhirlearning.web.dto.CourseDtos.EnrollmentDto;

@RestController
@RequestMapping("/api/v1/courses")
public class CourseController {
    private final CourseService service;
    private final EnrollmentService enrollmentService;

    public CourseController(CourseService service, EnrollmentService enrollmentService) {
        this.service = service;
        this.enrollmentService = enrollmentService;
    }

    @GetMapping
    public List<CourseSummaryDto> list(@RequestParam(required = false) String q, @RequestParam(required = false) String level) {
        return service.list(q, level);
    }

    @GetMapping("/{slug}")
    public CourseDetailDto get(@PathVariable String slug) { return service.get(slug); }

    @PostMapping("/{slug}/enroll")
    public EnrollmentDto enroll(@PathVariable String slug) { return enrollmentService.enroll(slug); }

    @GetMapping("/me/enrollments")
    public List<EnrollmentDto> mine() { return enrollmentService.mine(); }

    @PostMapping("/{slug}/certificate")
    public EnrollmentDto certificate(@PathVariable String slug) { return enrollmentService.issueCertificate(slug); }
}