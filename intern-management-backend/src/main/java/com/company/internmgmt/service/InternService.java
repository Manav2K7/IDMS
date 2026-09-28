package com.company.internmgmt.service;

import com.company.internmgmt.dto.InternRequestDto;
import com.company.internmgmt.dto.InternResponseDto;
import com.company.internmgmt.dto.InternUpdateRequestDto;
import com.company.internmgmt.enums.IdCardType;

import java.util.List;

public interface InternService {

    InternResponseDto createIntern(InternRequestDto request);

    InternResponseDto getIntern(Long id);

    List<InternResponseDto> listInterns(String name, Long batchId, IdCardType idCardType);

    InternResponseDto updateIntern(Long id, InternUpdateRequestDto request);

    void deleteIntern(Long id);
}
