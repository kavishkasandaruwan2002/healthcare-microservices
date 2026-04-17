package com.healthcare.appointment.event;

import com.healthcare.appointment.entity.AppointmentStatus;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppointmentEvent {
    private String appointmentId;

    private String patientId;
    private String patientName;
    private String patientEmail;
    private String patientPhone;

    private String doctorId;
    private String doctorName;
    private String doctorEmail;
    private String doctorSpecialization;

    private LocalDateTime appointmentTime;
    private String appointmentDate;   // YYYY-MM-DD string for convenience
    private String appointmentTimeStr; // HH:mm string for convenience

    private AppointmentStatus status;
    private String reason;
    private String type; // CREATED, CONFIRMED, CANCELLED, COMPLETED
}
