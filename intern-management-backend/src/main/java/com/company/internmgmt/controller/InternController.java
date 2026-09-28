package com.company.internmgmt.controller;

import com.company.internmgmt.dto.InternRequestDto;
import com.company.internmgmt.dto.InternResponseDto;
import com.company.internmgmt.dto.InternUpdateRequestDto;
import com.company.internmgmt.enums.IdCardType;
import com.company.internmgmt.service.InternService;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/interns")
public class InternController {

    private final InternService internService;

    public InternController(InternService internService) {
        this.internService = internService;
    }

    @PostMapping
    public ResponseEntity<InternResponseDto> create(@Valid @RequestBody InternRequestDto request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(internService.createIntern(request));
    }

    @GetMapping
    public List<InternResponseDto> list(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Long batchId,
            @RequestParam(required = false) IdCardType idCardType) {
        return internService.listInterns(name, batchId, idCardType);
    }

    @GetMapping("/{id}")
    public InternResponseDto get(@PathVariable Long id) {
        return internService.getIntern(id);
    }

    @PutMapping("/{id}")
    public InternResponseDto update(@PathVariable Long id, @Valid @RequestBody InternUpdateRequestDto request) {
        return internService.updateIntern(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        internService.deleteIntern(id);
        return ResponseEntity.noContent().build();
    }
}
