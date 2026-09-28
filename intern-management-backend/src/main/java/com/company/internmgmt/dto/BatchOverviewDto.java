package com.company.internmgmt.dto;

import java.time.LocalDate;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

/**
 * Batch overview: the batch itself plus every intern assigned to it.
 */
@Getter
@Setter
@AllArgsConstructor
public class BatchOverviewDto {

    private Long id;
    private LocalDate startDate;
    private LocalDate endDate;
    private List<InternResponseDto> interns;
}
