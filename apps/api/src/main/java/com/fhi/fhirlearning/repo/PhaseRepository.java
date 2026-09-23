package com.fhi.fhirlearning.repo;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.fhi.fhirlearning.domain.phase.Phase;

public interface PhaseRepository extends JpaRepository<Phase, Short> {

    List<Phase> findAllByOrderBySortOrderAsc();

    List<Phase> findByTrackIgnoreCaseOrderBySortOrderAsc(String track);
}
