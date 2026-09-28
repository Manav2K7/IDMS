package com.company.internmgmt.dto;

import java.time.LocalDate;

import com.company.internmgmt.enums.IdCardType;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class InternResponseDto {

    private Long id;
    private String internId;
    private String name;
    private String email;
    private String mobile;
    private IdCardType idCardType;
    private LocalDate dateOfJoining;
    private Long batchId;
}
