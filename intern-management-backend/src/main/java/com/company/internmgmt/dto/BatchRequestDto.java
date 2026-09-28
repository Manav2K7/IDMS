package com.company.internmgmt.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BatchRequestDto {

    // End date is intentionally absent — the service derives it from startDate
    // (+ 6 months), so clients never supply or influence batch duration.
    @NotNull(message = "startDate is required")
    private LocalDate startDate;
}
