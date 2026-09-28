package com.company.internmgmt.mapper;

import com.company.internmgmt.dto.BatchOverviewDto;
import com.company.internmgmt.dto.BatchResponseDto;
import com.company.internmgmt.dto.InternResponseDto;
import com.company.internmgmt.entity.Batch;

import java.util.List;

import org.springframework.stereotype.Component;

@Component
public class BatchMapper {

    public BatchResponseDto toResponseDto(Batch batch, long internCount) {
        return new BatchResponseDto(
                batch.getId(),
                batch.getStartDate(),
                batch.getEndDate(),
                internCount);
    }

    public BatchOverviewDto toOverviewDto(Batch batch, List<InternResponseDto> interns) {
        return new BatchOverviewDto(
                batch.getId(),
                batch.getStartDate(),
                batch.getEndDate(),
                interns);
    }
}
