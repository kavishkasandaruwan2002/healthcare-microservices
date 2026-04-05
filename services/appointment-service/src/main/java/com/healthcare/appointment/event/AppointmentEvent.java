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
    private String doctorId;
    private LocalDateTime appointmentTime;
    private AppointmentStatus status;
    private String type; // CREATED, CANCELLED, COMPLETED
}
