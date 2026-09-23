package org.fhirld.api.repo;

import java.util.List;

import org.fhirld.api.domain.LabPatient;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LabPatientRepository extends JpaRepository<LabPatient, String> {
    List<LabPatient> findByFamilyContainingIgnoreCase(String family);
}
