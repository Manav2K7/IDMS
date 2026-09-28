package com.company.internmgmt.service;

import com.company.internmgmt.enums.IdCardType;
import com.company.internmgmt.repository.InternRepository;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.stereotype.Service;

/**
 * Generates unique Intern IDs of the form PREFIX{yyyyMMdd}-{seq}
 * (TDA = Free card, EMP = Premium card).
 *
 * Deliberately a standalone service with no controller involvement so the
 * formatting/sequencing rules can be unit-tested in isolation.
 */
@Service
public class IdGeneratorService {

    private static final DateTimeFormatter DATE_PART = DateTimeFormatter.BASIC_ISO_DATE; // yyyyMMdd

    private final InternRepository internRepository;

    public IdGeneratorService(InternRepository internRepository) {
        this.internRepository = internRepository;
    }

    public String generateInternId(IdCardType cardType, LocalDate joinDate) {
        // Free and Premium IDs differ by prefix, so they never compete for the
        // same sequence even on the same day.
        String prefix = cardType == IdCardType.PREMIUM ? "EMP" : "TDA";
        String base = prefix + DATE_PART.format(joinDate);
        int nextSequence = nextSequence(base);

        return base + "-" + String.format("%03d", nextSequence);
    }

    private int nextSequence(String base) {
        // Two interns joining the same day with the same card type would
        // collide if the sequence came from anywhere but the DB, so we look up
        // every ID already stored for this exact date+prefix and take max+1.
        // An in-memory counter would reset on every restart and drift apart
        // across concurrent requests — this way the source of truth is always
        // the intern table itself.
        List<String> existingIds = internRepository.findInternIdsByPrefix(base);

        return existingIds.stream()
                .map(id -> id.substring(id.lastIndexOf('-') + 1))
                .filter(seq -> seq.matches("\\d+"))
                .mapToInt(Integer::parseInt)
                .max()
                .orElse(0) + 1;
    }
}
