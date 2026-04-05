package com.healthcare.appointment.mapper;

import com.healthcare.appointment.dto.AppointmentRequest;
import com.healthcare.appointment.dto.AppointmentResponse;
import com.healthcare.appointment.entity.Appointment;
import com.healthcare.appointment.entity.AppointmentStatus;
import org.springframework.stereotype.Component;

@Component
public class AppointmentMapper {


    public Appointment toEntity(AppointmentRequest request) {
        return Appointment.builder()
                .patientId(request.getPatientId())
                .doctorId(request.getDoctorId())
                .appointmentTime(request.getAppointmentTime())
                .durationMinutes(request.getDurationMinutes())
                .status(AppointmentStatus.PENDING) // Default status
                .reason(request.getReason())
                .build();
    }

    public AppointmentResponse toResponse(Appointment entity) {
        return AppointmentResponse.builder()
                .id(entity.getId())
                .patientId(entity.getPatientId())
                .doctorId(entity.getDoctorId())
                .appointmentTime(entity.getAppointmentTime())
                .durationMinutes(entity.getDurationMinutes())
                .status(entity.getStatus())
                .reason(entity.getReason())
                .prescription(entity.getPrescription())
                .cost(entity.getCost())
                .paid(entity.isPaid())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
