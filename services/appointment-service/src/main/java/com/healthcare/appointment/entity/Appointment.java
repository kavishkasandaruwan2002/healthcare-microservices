package com.healthcare.appointment.entity;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "appointments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Appointment {

    @Id
    private String id;

    private String patientId;
    private String patientName;
    private String patientEmail;
    private String patientPhone;

    private String doctorId;
    private String doctorName;
    private String doctorEmail;
    private String doctorSpecialization;

    private LocalDateTime appointmentTime;
    private int durationMinutes;

    private AppointmentStatus status;
    private String reason;
    private String appointmentType; // IN_PERSON or TELEMEDICINE
    private String notes;
    private String prescription;

    private Double cost;
    private boolean paid;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
