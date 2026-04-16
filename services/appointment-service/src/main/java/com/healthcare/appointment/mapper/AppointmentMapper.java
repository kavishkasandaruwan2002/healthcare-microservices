package com.healthcare.appointment.mapper;

import com.healthcare.appointment.dto.AppointmentBookingRequest;
import com.healthcare.appointment.dto.AppointmentRequest;
import com.healthcare.appointment.dto.AppointmentResponse;
import com.healthcare.appointment.entity.Appointment;
import com.healthcare.appointment.entity.AppointmentStatus;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;

@Component
public class AppointmentMapper {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ISO_DATE;
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ISO_TIME;

    /**
     * Map Request DTO to Entity (with LocalDateTime)
     */
    public Appointment toEntity(AppointmentRequest request) {
        return Appointment.builder()
                .patientId(request.getPatientId())
                .doctorId(request.getDoctorId())
                .appointmentTime(request.getAppointmentTime())
                .durationMinutes(request.getDurationMinutes())
                .status(AppointmentStatus.PENDING)
                .reason(request.getReason())
                .appointmentType(request.getAppointmentType() != null ? request.getAppointmentType() : "IN_PERSON")
                .notes(request.getNotes())
                .build();
    }

    /**
     * Map Frontend Booking Request to Entity (converts date/time strings)
     */
    public Appointment toEntity(AppointmentBookingRequest request) {
        try {
            LocalDate date = LocalDate.parse(request.getDate(), DATE_FORMATTER);
            LocalTime time = LocalTime.parse(request.getTime());
            LocalDateTime appointmentTime = LocalDateTime.of(date, time);

            return Appointment.builder()
                    .patientId(request.getPatientId())
                    .doctorId(request.getDoctorId())
                    .appointmentTime(appointmentTime)
                    .durationMinutes(30)
                    .status(AppointmentStatus.PENDING)
                    .reason(request.getReason())
                    .appointmentType(request.getAppointmentType() != null ? request.getAppointmentType() : "IN_PERSON")
                    .notes(request.getNotes())
                    .build();
        } catch (Exception e) {
            throw new RuntimeException("Invalid date/time format. Expected date: YYYY-MM-DD, time: HH:mm", e);
        }
    }

    /**
     * Map Entity to Response DTO (with enriched data)
     */
    public AppointmentResponse toResponse(Appointment entity) {
        LocalDateTime appointmentTime = entity.getAppointmentTime();
        String date = appointmentTime != null ? appointmentTime.format(DATE_FORMATTER) : null;
        String time = appointmentTime != null ? appointmentTime.toLocalTime().toString() : null;

        return AppointmentResponse.builder()
                .id(entity.getId())
                .patientId(entity.getPatientId())
                .patientName(entity.getPatientName())
                .patientEmail(entity.getPatientEmail())
                .patientPhone(entity.getPatientPhone())
                .doctorId(entity.getDoctorId())
                .doctorName(entity.getDoctorName())
                .doctorEmail(entity.getDoctorEmail())
                .doctorSpecialization(entity.getDoctorSpecialization())
                .appointmentTime(entity.getAppointmentTime())
                .date(date)
                .time(time)
                .durationMinutes(entity.getDurationMinutes())
                .status(entity.getStatus())
                .reason(entity.getReason())
                .appointmentType(entity.getAppointmentType())
                .notes(entity.getNotes())
                .prescription(entity.getPrescription())
                .cost(entity.getCost())
                .paid(entity.isPaid())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
