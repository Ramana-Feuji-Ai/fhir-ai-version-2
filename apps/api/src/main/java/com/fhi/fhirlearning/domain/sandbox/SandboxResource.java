package com.fhi.fhirlearning.domain.sandbox;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

/**
 * Current-state row for a simulated FHIR resource instance in the sandbox.
 * The FHIR JSON payload is stored as text; {@link SandboxResourceHistory} keeps every version.
 */
@Entity
@Table(name = "sandbox_resource", uniqueConstraints = @UniqueConstraint(columnNames = {"resource_type", "fhir_id"}))
public class SandboxResource {
    @Id @GeneratedValue private UUID id;
    @Column(name = "resource_type", nullable = false, length = 60) private String resourceType;
    @Column(name = "fhir_id", nullable = false, length = 80) private String fhirId;
    @Column(name = "version_id", nullable = false) private int versionId;
    @Column(nullable = false, columnDefinition = "text") private String payload;
    @Column(name = "last_updated", nullable = false) private Instant lastUpdated;
    @Column(nullable = false) private boolean deleted;

    public UUID getId() { return id; }
    public String getResourceType() { return resourceType; }
    public void setResourceType(String resourceType) { this.resourceType = resourceType; }
    public String getFhirId() { return fhirId; }
    public void setFhirId(String fhirId) { this.fhirId = fhirId; }
    public int getVersionId() { return versionId; }
    public void setVersionId(int versionId) { this.versionId = versionId; }
    public String getPayload() { return payload; }
    public void setPayload(String payload) { this.payload = payload; }
    public Instant getLastUpdated() { return lastUpdated; }
    public void setLastUpdated(Instant lastUpdated) { this.lastUpdated = lastUpdated; }
    public boolean isDeleted() { return deleted; }
    public void setDeleted(boolean deleted) { this.deleted = deleted; }
}
