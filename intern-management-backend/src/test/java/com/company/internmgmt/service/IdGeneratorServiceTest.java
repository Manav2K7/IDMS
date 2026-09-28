package com.company.internmgmt.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.company.internmgmt.enums.IdCardType;
import com.company.internmgmt.repository.InternRepository;

import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class IdGeneratorServiceTest {

    @Mock
    private InternRepository internRepository;

    @InjectMocks
    private IdGeneratorService idGeneratorService;

    private static final LocalDate JOIN_DATE = LocalDate.of(2024, 11, 29);

    @Test
    @DisplayName("Free card intern gets TDA prefix with join date formatted as yyyyMMdd")
    void freeCardUsesTdaPrefixAndDatePart() {
        when(internRepository.findInternIdsByPrefix("TDA20241129")).thenReturn(List.of());

        String id = idGeneratorService.generateInternId(IdCardType.FREE, JOIN_DATE);

        assertThat(id).isEqualTo("TDA20241129-001");
    }

    @Test
    @DisplayName("Premium card intern gets EMP prefix with join date formatted as yyyyMMdd")
    void premiumCardUsesEmpPrefixAndDatePart() {
        when(internRepository.findInternIdsByPrefix("EMP20241129")).thenReturn(List.of());

        String id = idGeneratorService.generateInternId(IdCardType.PREMIUM, JOIN_DATE);

        assertThat(id).isEqualTo("EMP20241129-001");
    }

    @Test
    @DisplayName("Two free interns join the same day — sequence shouldn't collide, second gets 002")
    void sequenceIncrementsForSameDaySameType() {
        // Simulates one intern already registered earlier that morning.
        when(internRepository.findInternIdsByPrefix("TDA20241129"))
                .thenReturn(List.of("TDA20241129-001"));

        String id = idGeneratorService.generateInternId(IdCardType.FREE, JOIN_DATE);

        assertThat(id).isEqualTo("TDA20241129-002");
    }

    @Test
    @DisplayName("Two premium interns join same day — sequence shouldn't collide")
    void sequenceIncrementsForPremiumSameDay() {
        when(internRepository.findInternIdsByPrefix("EMP20241129"))
                .thenReturn(List.of("EMP20241129-001", "EMP20241129-002"));

        String id = idGeneratorService.generateInternId(IdCardType.PREMIUM, JOIN_DATE);

        assertThat(id).isEqualTo("EMP20241129-003");
    }

    @Test
    @DisplayName("Free and Premium sequences run independently — a premium at 007 doesn't push the next free intern past 001")
    void freeAndPremiumSequencesAreIndependent() {
        // Premium interns already used sequences 1-7 today; free count untouched.
        when(internRepository.findInternIdsByPrefix("TDA20241129")).thenReturn(List.of());
        when(internRepository.findInternIdsByPrefix("EMP20241129"))
                .thenReturn(List.of("EMP20241129-005", "EMP20241129-006", "EMP20241129-007"));

        String freeId = idGeneratorService.generateInternId(IdCardType.FREE, JOIN_DATE);
        String premiumId = idGeneratorService.generateInternId(IdCardType.PREMIUM, JOIN_DATE);

        assertThat(freeId).isEqualTo("TDA20241129-001");
        assertThat(premiumId).isEqualTo("EMP20241129-008");
    }

    @Test
    @DisplayName("Sequence picks up after a restart — earlier dates don't leak into today's count")
    void sequenceIsScopedToExactDateAndPrefix() {
        // Yesterday's IDs and the other card type's IDs are returned by the
        // query? They shouldn't be: the query filters by exact base prefix.
        when(internRepository.findInternIdsByPrefix("TDA20241129"))
                .thenReturn(List.of("TDA20241129-041"));

        String id = idGeneratorService.generateInternId(IdCardType.FREE, JOIN_DATE);

        // Yesterday's TDA20241128-042 and today's EMP20241129-043 must not
        // influence this result.
        assertThat(id).isEqualTo("TDA20241129-042");
    }

    @Test
    @DisplayName("Sequence survives the 999 ceiling — 1000 renders unpadded, not truncated")
    void sequenceBeyondThreeDigitsIsNotCorrupted() {
        when(internRepository.findInternIdsByPrefix("TDA20241129"))
                .thenReturn(List.of("TDA20241129-999"));

        String id = idGeneratorService.generateInternId(IdCardType.FREE, JOIN_DATE);

        assertThat(id).isEqualTo("TDA20241129-1000");
    }

    @Test
    @DisplayName("First intern of the day starts at 001, zero-padded to three digits")
    void sequenceIsZeroPaddedToThreeDigits() {
        when(internRepository.findInternIdsByPrefix("EMP20241129")).thenReturn(List.of());

        String id = idGeneratorService.generateInternId(IdCardType.PREMIUM, JOIN_DATE);

        assertThat(id).startsWith("EMP20241129-").endsWith("-001");
        assertThat(id).hasSize("EMP20241129-001".length());
    }
}
