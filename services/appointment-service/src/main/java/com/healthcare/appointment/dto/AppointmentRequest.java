package com.healthcare.appointment.dto;

import lombok.*;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppointmentRequest {

    @NotBlank(message = "Patient ID is mandatory")
    private String patientId;

    @NotBlank(message = "Doctor ID is mandatory")
    private String doctorId;

    @NotNull(message = "Appointment time is mandatory")
    private LocalDateTime appointmentTime;

    @Builder.Default
    private int durationMinutes = 30; // Default 30 minutes

    private String reason;

    private String appointmentType; // Optional: IN_PERSON, TELEMEDICINE
    private String notes;
}

