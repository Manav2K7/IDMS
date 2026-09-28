package com.company.internmgmt.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

/**
 * Update payload for an intern. Deliberately narrower than
 * {@link InternRequestDto}: only the fields the PRD allows editing are present.
 * {@code internId} is the immutable business key, and {@code idCardType} /
 * {@code dateOfJoining} / {@code batchId} encode the generated ID and training
 * history, so they are not editable in v1 — omitting them here means a client
 * cannot change them even by accident.
 */
@Getter
@Setter
public class InternUpdateRequestDto {

    @NotBlank(message = "name is required")
    @Size(max = 100, message = "name must be at most 100 characters")
    private String name;

    @NotBlank(message = "email is required")
    @Email(message = "email must be a valid address")
    @Size(max = 255, message = "email must be at most 255 characters")
    private String email;

    @NotBlank(message = "mobile is required")
    @Pattern(regexp = "^\\+?[0-9]{10,15}$", message = "mobile must be 10-15 digits, optional leading +")
    @Size(max = 20, message = "mobile must be at most 20 characters")
    private String mobile;
}
