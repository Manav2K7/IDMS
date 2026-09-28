package com.company.internmgmt.service;

import com.company.internmgmt.dto.InternRequestDto;
import com.company.internmgmt.dto.InternResponseDto;
import com.company.internmgmt.dto.InternUpdateRequestDto;
import com.company.internmgmt.entity.Batch;
import com.company.internmgmt.entity.Intern;
import com.company.internmgmt.enums.IdCardType;
import com.company.internmgmt.exception.ResourceNotFoundException;
import com.company.internmgmt.mapper.InternMapper;
import com.company.internmgmt.repository.BatchRepository;
import com.company.internmgmt.repository.InternRepository;

import jakarta.persistence.criteria.Predicate;

import java.util.ArrayList;
import java.util.List;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.util.StringUtils;

@Service
public class InternServiceImpl implements InternService {

    /**
     * How many times a create is allowed to regenerate its ID after losing a
     * same-date/same-card-type race. Each attempt is a fresh transaction.
     */
    private static final int MAX_ID_ATTEMPTS = 5;

    private final InternRepository internRepository;
    private final BatchRepository batchRepository;
    private final IdGeneratorService idGeneratorService;
    private final InternMapper internMapper;
    private final TransactionTemplate transactionTemplate;

    public InternServiceImpl(InternRepository internRepository,
                             BatchRepository batchRepository,
                             IdGeneratorService idGeneratorService,
                             InternMapper internMapper,
                             TransactionTemplate transactionTemplate) {
        this.internRepository = internRepository;
        this.batchRepository = batchRepository;
        this.idGeneratorService = idGeneratorService;
        this.internMapper = internMapper;
        this.transactionTemplate = transactionTemplate;
    }

    @Override
    public InternResponseDto createIntern(InternRequestDto request) {
        // Intern IDs are derived from (dateOfJoining, idCardType) by reading the
        // max existing sequence — a read-then-write that two concurrent requests
        // can lose, both minting the same ID. The unique constraint on intern_id
        // protects the data, so here we just retry with a fresh sequence. Each
        // attempt runs in its own transaction because a constraint violation
        // aborts the current one.
        for (int attempt = 1; ; attempt++) {
            try {
                return transactionTemplate.execute(status -> persistIntern(request));
            } catch (DataIntegrityViolationException ex) {
                if (attempt >= MAX_ID_ATTEMPTS) {
                    // Genuinely stuck (or a non-ID constraint): let the global
                    // handler translate it rather than looping forever.
                    throw ex;
                }
                // Another request took our sequence — regenerate and retry.
            }
        }
    }

    private InternResponseDto persistIntern(InternRequestDto request) {
        // Batch is mandatory (PRD: no intern without a batch) — fail fast with
        // a 404 rather than tripping the FK constraint at flush time.
        Batch batch = batchRepository.findById(request.getBatchId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Batch not found with id: " + request.getBatchId()));

        Intern intern = new Intern();
        intern.setName(request.getName());
        intern.setEmail(request.getEmail());
        intern.setMobile(request.getMobile());
        intern.setIdCardType(request.getIdCardType());
        intern.setDateOfJoining(request.getDateOfJoining());
        intern.setBatch(batch);

        // The ID encodes join date + card type, so it's minted from the
        // request values at creation time and never touched again.
        intern.setInternId(
                idGeneratorService.generateInternId(request.getIdCardType(), request.getDateOfJoining()));

        // saveAndFlush forces the unique-constraint check now, inside the
        // transaction, so the race is caught here and retried above.
        return internMapper.toResponseDto(internRepository.saveAndFlush(intern));
    }

    @Override
    @Transactional(readOnly = true)
    public InternResponseDto getIntern(Long id) {
        return internMapper.toResponseDto(findIntern(id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<InternResponseDto> listInterns(String name, Long batchId, IdCardType idCardType) {
        Specification<Intern> spec = (root, query, cb) -> {
            List<Predicate> filters = new ArrayList<>();
            if (StringUtils.hasText(name)) {
                filters.add(cb.like(cb.lower(root.get("name")), "%" + name.toLowerCase() + "%"));
            }
            if (batchId != null) {
                filters.add(cb.equal(root.get("batch").get("id"), batchId));
            }
            if (idCardType != null) {
                filters.add(cb.equal(root.get("idCardType"), idCardType));
            }
            return cb.and(filters.toArray(new Predicate[0]));
        };

        // createdAt alone isn't unique; id is the stable tie-breaker so paging
        // through results later can't skip or repeat rows.
        Sort sort = Sort.by(Sort.Direction.DESC, "createdAt").and(Sort.by(Sort.Direction.DESC, "id"));

        return internRepository.findAll(spec, sort).stream()
                .map(internMapper::toResponseDto)
                .toList();
    }

    @Override
    @Transactional
    public InternResponseDto updateIntern(Long id, InternUpdateRequestDto request) {
        // Only name/email/mobile exist on the update DTO, so internId, batch,
        // card type and join date physically cannot be changed here — the
        // immutability rule is enforced by the request shape, not a comment.
        Intern intern = findIntern(id);
        intern.setName(request.getName());
        intern.setEmail(request.getEmail());
        intern.setMobile(request.getMobile());

        return internMapper.toResponseDto(internRepository.save(intern));
    }

    @Override
    @Transactional
    public void deleteIntern(Long id) {
        internRepository.delete(findIntern(id));
    }

    private Intern findIntern(Long id) {
        return internRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Intern not found with id: " + id));
    }
}
