package com.company.internmgmt.mapper;

import com.company.internmgmt.dto.InternResponseDto;
import com.company.internmgmt.entity.Intern;

import org.springframework.stereotype.Component;

@Component
public class InternMapper {

    public InternResponseDto toResponseDto(Intern intern) {
        return new InternResponseDto(
                intern.getId(),
                intern.getInternId(),
                intern.getName(),
                intern.getEmail(),
                intern.getMobile(),
                intern.getIdCardType(),
                intern.getDateOfJoining(),
                intern.getBatch() != null ? intern.getBatch().getId() : null);
    }
}
