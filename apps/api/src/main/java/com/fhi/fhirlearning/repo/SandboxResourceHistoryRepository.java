package com.fhi.fhirlearning.repo;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.fhi.fhirlearning.domain.sandbox.SandboxResourceHistory;

public interface SandboxResourceHistoryRepository extends JpaRepository<SandboxResourceHistory, java.util.UUID> {

    List<SandboxResourceHistory> findByResourceTypeAndFhirIdOrderByVersionIdDesc(String resourceType, String fhirId);

    void deleteByResourceType(String resourceType);
}
