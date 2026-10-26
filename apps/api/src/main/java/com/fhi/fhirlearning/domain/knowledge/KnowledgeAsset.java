package com.fhi.fhirlearning.domain.knowledge;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * An approved (or pending/disabled) piece of enterprise FHIR knowledge -- a standard, pattern, FAQ,
 * ADR, or implementation decision -- that the Enterprise Knowledge Assistant (PRD 8.5) indexes,
 * cites, and can be version-managed or disabled by an administrator (FR-022, FR-025, FR-026).
 */
@Entity
@Table(name = "knowledge_asset")
public class KnowledgeAsset {

    public static final String STATUS_APPROVED = "APPROVED";
    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_DISABLED = "DISABLED";

    @Id @GeneratedValue private UUID id;
    @Column(nullable = false, length = 200) private String title;
    @Column(name = "asset_type", nullable = false, length = 60) private String assetType;
    @Column(nullable = false, length = 30) private String version;
    @Column(nullable = false, length = 20) private String status;
    @Column(length = 300) private String tags;
    @Column(nullable = false, columnDefinition = "text") private String summary;
    @Column(nullable = false, columnDefinition = "text") private String content;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;

    public UUID getId() { return id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getAssetType() { return assetType; }
    public void setAssetType(String assetType) { this.assetType = assetType; }
    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = version; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }
    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
