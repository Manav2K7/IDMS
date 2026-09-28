package com.company.internmgmt.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.transaction.TestTransaction;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class BatchControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("Create batch: coordinator only picks a start date — backend computes the 6-month end date")
    void createBatch_returns201_withCalculatedEndDate() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of("startDate", "2026-01-15"));

        mockMvc.perform(post("/api/batches")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.startDate").value("2026-01-15"))
                // PRD rule: end date = start + 6 months, never client-supplied
                .andExpect(jsonPath("$.endDate").value("2026-07-15"))
                .andExpect(jsonPath("$.internCount").value(0));
    }

    @Test
    @DisplayName("Create batch without a start date — validation failure must be a clean 400, not a 500")
    void createBatch_missingStartDate_returns400WithFieldError() throws Exception {
        mockMvc.perform(post("/api/batches")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.startDate").value("startDate is required"));
    }

    @Test
    @DisplayName("Overview of a batch that doesn't exist — 404 with a readable message")
    void getOverview_unknownBatch_returns404() throws Exception {
        mockMvc.perform(get("/api/batches/9999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Batch not found with id: 9999"));
    }

    @Test
    @DisplayName("Overview embeds the batch's interns, and the list count matches")
    void getOverview_includesAssignedInterns() throws Exception {
        String batchJson = mockMvc.perform(post("/api/batches")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("startDate", "2026-02-01"))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        long batchId = objectMapper.readTree(batchJson).get("id").asLong();

        mockMvc.perform(post("/api/interns")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", "Asha Verma",
                                "email", "asha.verma@example.com",
                                "mobile", "9876543210",
                                "idCardType", "FREE",
                                "dateOfJoining", "2026-02-05",
                                "batchId", batchId))))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/batches/" + batchId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.interns", org.hamcrest.Matchers.hasSize(1)))
                .andExpect(jsonPath("$.interns[0].batchId").value(batchId));

        // The list view must report the same count (grouped-query path).
        mockMvc.perform(get("/api/batches"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(batchId))
                .andExpect(jsonPath("$[0].internCount").value(1));
    }
}
