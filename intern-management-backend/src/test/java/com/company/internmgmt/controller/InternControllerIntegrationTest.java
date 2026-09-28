package com.company.internmgmt.controller;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.company.internmgmt.entity.Batch;
import com.company.internmgmt.repository.BatchRepository;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class InternControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private BatchRepository batchRepository;

    private Long existingBatchId;

    @BeforeEach
    void seedBatch() {
        // Interns can't exist without a batch (PRD), so every scenario starts
        // from one real persisted batch.
        Batch batch = new Batch();
        batch.setStartDate(LocalDate.of(2026, 1, 1));
        batch.setEndDate(LocalDate.of(2026, 7, 1));
        existingBatchId = batchRepository.save(batch).getId();
    }

    private Map<String, Object> validInternRequest() {
        Map<String, Object> body = new HashMap<>();
        body.put("name", "Asha Verma");
        body.put("email", "asha.verma@example.com");
        body.put("mobile", "9876543210");
        body.put("idCardType", "FREE");
        body.put("dateOfJoining", "2026-01-05");
        body.put("batchId", existingBatchId);
        return body;
    }

    private String jsonOf(Map<String, Object> body) throws Exception {
        return objectMapper.writeValueAsString(body);
    }

    @Test
    @DisplayName("Happy path: two free interns join the same day — sequence shouldn't collide (001 then 002)")
    void createIntern_happyPath_generatesSequentialIdsPerDayAndType() throws Exception {
        mockMvc.perform(post("/api/interns")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonOf(validInternRequest())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.internId").value("TDA20260105-001"))
                .andExpect(jsonPath("$.batchId").value(existingBatchId));

        // Second registration, same day and same card type as the first.
        Map<String, Object> second = new HashMap<>(validInternRequest());
        second.put("name", "Rohan Iyer");
        second.put("email", "rohan.iyer@example.com");

        mockMvc.perform(post("/api/interns")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonOf(second)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.internId").value("TDA20260105-002"));
    }

    @Test
    @DisplayName("A premium intern joining the same day as free interns starts the EMP sequence from 001")
    void createIntern_premiumCardGetsEmpPrefixAndOwnSequence() throws Exception {
        Map<String, Object> premium = validInternRequest();
        premium.put("idCardType", "PREMIUM");
        premium.put("name", "Meera Nair");
        premium.put("email", "meera.nair@example.com");

        mockMvc.perform(post("/api/interns")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonOf(premium)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.internId").value("EMP20260105-001"));
    }

    @Test
    @DisplayName("Registration without an email — Bean Validation must reject with a 400 and field error")
    void createIntern_missingEmail_returns400() throws Exception {
        Map<String, Object> body = validInternRequest();
        body.remove("email");

        mockMvc.perform(post("/api/interns")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonOf(body)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.email").value("email is required"));
    }

    @Test
    @DisplayName("Mobile number that isn't 10-15 digits — regex validation kicks in with a 400")
    void createIntern_invalidMobile_returns400() throws Exception {
        Map<String, Object> body = validInternRequest();
        body.put("mobile", "98765-abc");

        mockMvc.perform(post("/api/interns")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonOf(body)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.mobile").value("mobile must be 10-15 digits, optional leading +"));
    }

    @Test
    @DisplayName("Registration pointing at a batch that doesn't exist — 404, nothing is saved")
    void createIntern_unknownBatch_returns404() throws Exception {
        Map<String, Object> body = validInternRequest();
        body.put("batchId", 99999L);

        mockMvc.perform(post("/api/interns")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonOf(body)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Batch not found with id: 99999"));
    }

    @Test
    @DisplayName("Update changes only name/email/mobile — internId and batch cannot be altered")
    void updateIntern_mutableFieldsOnly_batchAndInternIdUnchanged() throws Exception {
        String created = mockMvc.perform(post("/api/interns")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonOf(validInternRequest())))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        long internPk = objectMapper.readTree(created).get("id").asLong();
        String generatedInternId = objectMapper.readTree(created).get("internId").asText();

        // Body deliberately carries batchId/idCardType/dateOfJoining, none of
        // which exist on the update DTO — they must be ignored, not applied.
        Map<String, Object> update = new HashMap<>();
        update.put("name", "Asha Updated");
        update.put("email", "asha.updated@example.com");
        update.put("mobile", "9876500000");
        update.put("batchId", 99999L);
        update.put("idCardType", "PREMIUM");
        update.put("dateOfJoining", "2030-01-01");

        mockMvc.perform(put("/api/interns/" + internPk)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonOf(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Asha Updated"))
                .andExpect(jsonPath("$.email").value("asha.updated@example.com"))
                .andExpect(jsonPath("$.internId").value(generatedInternId))
                .andExpect(jsonPath("$.batchId").value(existingBatchId))
                .andExpect(jsonPath("$.idCardType").value("FREE"));
    }

    @Test
    @DisplayName("Delete removes the intern — a follow-up GET is a 404")
    void deleteIntern_thenGet_returns404() throws Exception {
        String created = mockMvc.perform(post("/api/interns")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonOf(validInternRequest())))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();

        long internPk = objectMapper.readTree(created).get("id").asLong();

        mockMvc.perform(delete("/api/interns/" + internPk))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/interns/" + internPk))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Combined list filters (name + batchId + idCardType) return only matching interns")
    void listInterns_combinedFilters_returnOnlyMatching() throws Exception {
        mockMvc.perform(post("/api/interns")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonOf(validInternRequest())))
                .andExpect(status().isCreated());

        Map<String, Object> premium = validInternRequest();
        premium.put("idCardType", "PREMIUM");
        premium.put("name", "Meera Nair");
        premium.put("email", "meera.nair@example.com");
        mockMvc.perform(post("/api/interns")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonOf(premium)))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/interns")
                        .param("name", "meera")
                        .param("batchId", String.valueOf(existingBatchId))
                        .param("idCardType", "PREMIUM"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].name").value("Meera Nair"))
                .andExpect(jsonPath("$[0].idCardType").value("PREMIUM"))
                .andExpect(jsonPath("$[0].batchId").value(existingBatchId));

        // Same batch/type but a name that matches nobody — empty, not an error.
        mockMvc.perform(get("/api/interns")
                        .param("name", "nobody")
                        .param("batchId", String.valueOf(existingBatchId))
                        .param("idCardType", "PREMIUM"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));
    }
}
