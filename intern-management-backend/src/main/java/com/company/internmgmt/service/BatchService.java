package com.company.internmgmt.service;

import com.company.internmgmt.dto.BatchOverviewDto;
import com.company.internmgmt.dto.BatchRequestDto;
import com.company.internmgmt.dto.BatchResponseDto;

import java.util.List;

public interface BatchService {

    BatchResponseDto create(BatchRequestDto request);

    List<BatchResponseDto> list();

    BatchOverviewDto getOverview(Long id);
}
