package com.fhi.fhirlearning.repo;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.fhi.fhirlearning.domain.sandbox.SandboxResource;

public interface SandboxResourceRepository extends JpaRepository<SandboxResource, java.util.UUID> {

    Optional<SandboxResource> findByResourceTypeAndFhirId(String resourceType, String fhirId);

    List<SandboxResource> findByResourceTypeAndDeletedFalse(String resourceType);

    List<SandboxResource> findByResourceType(String resourceType);

    long countByResourceTypeAndDeletedFalse(String resourceType);

    void deleteByResourceType(String resourceType);
}
