package com.fhi.fhirlearning.repo;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.fhi.fhirlearning.domain.knowledge.KnowledgeAsset;

public interface KnowledgeAssetRepository extends JpaRepository<KnowledgeAsset, UUID> {
    List<KnowledgeAsset> findByStatus(String status);
    List<KnowledgeAsset> findAllByOrderByTitleAsc();
}
