package com.fhi.fhirlearning.repo;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.fhi.fhirlearning.domain.progress.TopicProgress;

public interface TopicProgressRepository extends JpaRepository<TopicProgress, TopicProgress.TopicProgressId> {

    @Query("""
            select tp from TopicProgress tp
            join tp.topic t
            join t.section s
            where tp.learner.id = :learnerId and s.phase.id = :phaseId and tp.completed = true
            """)
    List<TopicProgress> findCompletedForPhase(@Param("learnerId") UUID learnerId, @Param("phaseId") Short phaseId);

    @Query("""
            select tp from TopicProgress tp
            where tp.learner.id = :learnerId and tp.completed = true
            """)
    List<TopicProgress> findAllCompleted(@Param("learnerId") UUID learnerId);

    @Query("""
            select s.phase.id, count(tp)
            from TopicProgress tp
            join tp.topic t
            join t.section s
            where tp.learner.id = :learnerId and tp.completed = true
            group by s.phase.id
            """)
    List<Object[]> countCompletedGroupedByPhase(@Param("learnerId") UUID learnerId);
}
