package com.healthcare.appointment.dto;

import com.healthcare.appointment.entity.AppointmentStatus;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppointmentResponse {
    private String id;
    private String patientId;
    private String doctorId;
    private LocalDateTime appointmentTime;
    private int durationMinutes;
    private AppointmentStatus status;
    private String reason;
    private String prescription;
    private Double cost;
    private boolean paid;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
