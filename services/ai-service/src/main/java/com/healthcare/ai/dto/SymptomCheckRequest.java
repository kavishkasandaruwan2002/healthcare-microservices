package com.healthcare.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SymptomCheckRequest {

    @NotEmpty(message = "At least one symptom is required")
    @Size(max = 12, message = "You can submit up to 12 symptoms")
    private List<@NotNull @Size(min = 2, max = 60) String> symptoms;

    @NotNull(message = "Duration is required")
    @Min(value = 0, message = "Duration cannot be negative")
    @Max(value = 365, message = "Duration is too large")
    private Integer durationDays;

    @NotNull(message = "Severity is required")
    private String severity;

    @Size(max = 500, message = "Additional notes are too long")
    private String additionalNotes;
}
