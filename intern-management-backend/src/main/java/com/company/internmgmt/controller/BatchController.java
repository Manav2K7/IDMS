package com.company.internmgmt.controller;

import com.company.internmgmt.dto.BatchOverviewDto;
import com.company.internmgmt.dto.BatchRequestDto;
import com.company.internmgmt.dto.BatchResponseDto;
import com.company.internmgmt.service.BatchService;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/batches")
public class BatchController {

    private final BatchService batchService;

    public BatchController(BatchService batchService) {
        this.batchService = batchService;
    }

    @PostMapping
    public ResponseEntity<BatchResponseDto> create(@Valid @RequestBody BatchRequestDto request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(batchService.create(request));
    }

    @GetMapping
    public List<BatchResponseDto> list() {
        return batchService.list();
    }

    @GetMapping("/{id}")
    public BatchOverviewDto getOverview(@PathVariable Long id) {
        return batchService.getOverview(id);
    }
}
