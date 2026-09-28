package com.company.internmgmt.dto;

import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class BatchResponseDto {

    private Long id;
    private LocalDate startDate;
    private LocalDate endDate;
    private long internCount;
}
