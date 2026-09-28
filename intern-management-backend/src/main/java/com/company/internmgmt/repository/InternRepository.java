package com.company.internmgmt.repository;

import com.company.internmgmt.entity.Intern;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface InternRepository extends JpaRepository<Intern, Long>, JpaSpecificationExecutor<Intern> {

    List<Intern> findByBatch_Id(Long batchId);

    // One grouped query for the whole batch list, instead of one COUNT per
    // batch (which is an N+1). Projected to an interface so the service reads
    // named accessors rather than Object[] indices.
    @Query("SELECT i.batch.id AS batchId, COUNT(i) AS total FROM Intern i GROUP BY i.batch.id")
    List<BatchInternCount> countGroupedByBatch();

    interface BatchInternCount {
        Long getBatchId();

        Long getTotal();
    }

    // Returns every internId sharing this date+prefix base (e.g. "TDA20241129").
    // IdGeneratorService derives max+1 from these in Java rather than a DB-side
    // string MAX(): once a sequence passes 999 the zero-padding disappears and
    // lexicographic MAX would pick "999" over "1000".
    @Query("SELECT i.internId FROM Intern i WHERE i.internId LIKE CONCAT(:prefix, '-%')")
    List<String> findInternIdsByPrefix(@Param("prefix") String prefix);
}
