package com.company.internmgmt.service;

import com.company.internmgmt.dto.BatchOverviewDto;
import com.company.internmgmt.dto.BatchRequestDto;
import com.company.internmgmt.dto.BatchResponseDto;
import com.company.internmgmt.dto.InternResponseDto;
import com.company.internmgmt.entity.Batch;
import com.company.internmgmt.exception.ResourceNotFoundException;
import com.company.internmgmt.mapper.BatchMapper;
import com.company.internmgmt.mapper.InternMapper;
import com.company.internmgmt.repository.BatchRepository;
import com.company.internmgmt.repository.InternRepository;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BatchServiceImpl implements BatchService {

    private final BatchRepository batchRepository;
    private final InternRepository internRepository;
    private final BatchMapper batchMapper;
    private final InternMapper internMapper;

    public BatchServiceImpl(BatchRepository batchRepository,
                            InternRepository internRepository,
                            BatchMapper batchMapper,
                            InternMapper internMapper) {
        this.batchRepository = batchRepository;
        this.internRepository = internRepository;
        this.batchMapper = batchMapper;
        this.internMapper = internMapper;
    }

    @Override
    @Transactional
    public BatchResponseDto create(BatchRequestDto request) {
        Batch batch = new Batch();
        batch.setStartDate(request.getStartDate());

        // Business rule from the PRD: every batch runs a fixed 6-month program,
        // so the end date is always derived, never accepted from the client.
        batch.setEndDate(request.getStartDate().plusMonths(6));

        Batch saved = batchRepository.save(batch);
        return batchMapper.toResponseDto(saved, 0);
    }

    @Override
    @Transactional(readOnly = true)
    public List<BatchResponseDto> list() {
        // Two queries total (batches + grouped counts), never one per batch.
        Map<Long, Long> countsByBatch = internRepository.countGroupedByBatch().stream()
                .collect(Collectors.toMap(
                        InternRepository.BatchInternCount::getBatchId,
                        InternRepository.BatchInternCount::getTotal));

        // Explicit order so list output is deterministic run to run.
        return batchRepository.findAll(Sort.by(Sort.Direction.ASC, "id")).stream()
                .map(batch -> batchMapper.toResponseDto(
                        batch, countsByBatch.getOrDefault(batch.getId(), 0L)))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public BatchOverviewDto getOverview(Long id) {
        Batch batch = batchRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Batch not found with id: " + id));

        List<InternResponseDto> interns = internRepository.findByBatch_Id(id).stream()
                .map(internMapper::toResponseDto)
                .toList();

        return batchMapper.toOverviewDto(batch, interns);
    }
}
