package com.healthcare.appointment.service;

import com.healthcare.appointment.dto.AppointmentRequest;
import com.healthcare.appointment.dto.AppointmentResponse;
import com.healthcare.appointment.entity.Appointment;
import com.healthcare.appointment.entity.AppointmentStatus;
import com.healthcare.appointment.event.AppointmentEvent;
import com.healthcare.appointment.event.AppointmentEventProducer;
import com.healthcare.appointment.mapper.AppointmentMapper;
import com.healthcare.appointment.repository.AppointmentRepository;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final AppointmentMapper appointmentMapper;
    private final AppointmentEventProducer eventProducer;
    private final org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

    public AppointmentResponse createAppointment(AppointmentRequest request) {
        log.info("Creating new appointment for patient {} with doctor {}", request.getPatientId(), request.getDoctorId());

        // Simple Conflict Detection
        LocalDateTime start = request.getAppointmentTime();
        LocalDateTime end = start.plusMinutes(request.getDurationMinutes());
        List<Appointment> conflicts = appointmentRepository.findConflicts(request.getDoctorId(), start, end);
        
        if (!conflicts.isEmpty()) {
            throw new RuntimeException("Doctor already has an appointment during this time!");
        }

        Appointment appointment = appointmentMapper.toEntity(request);
        if (appointment == null) throw new RuntimeException("Appointment mapping failed");
        appointment = appointmentRepository.save(appointment);

        // Publish event
        AppointmentEvent event = AppointmentEvent.builder()
                .appointmentId(appointment.getId())
                .patientId(appointment.getPatientId())
                .doctorId(appointment.getDoctorId())
                .appointmentTime(appointment.getAppointmentTime())
                .status(appointment.getStatus())
                .type("CREATED")
                .build();
        eventProducer.publishCreatedEvent(event);

        // Notify via WebSocket
        messagingTemplate.convertAndSend("/topic/appointment/" + appointment.getDoctorId(), "New Appointment Booked!");
        messagingTemplate.convertAndSend("/topic/appointment/" + appointment.getPatientId(), "Appointment Successfully Booked!");

        return appointmentMapper.toResponse(appointment);
    }


    public List<AppointmentResponse> getPatientAppointments(String patientId) {
        return appointmentRepository.findByPatientId(patientId).stream()
                .map(appointmentMapper::toResponse)
                .collect(Collectors.toList());
    }

    @CircuitBreaker(name = "doctorService", fallbackMethod = "getDoctorAppointmentsFallback")
    public List<AppointmentResponse> getDoctorAppointments(String doctorId) {
        return appointmentRepository.findByDoctorId(doctorId).stream()
                .map(appointmentMapper::toResponse)
                .collect(Collectors.toList());
    }

    // Fallback for Circuit Breaker
    public List<AppointmentResponse> getDoctorAppointmentsFallback(String doctorId, Throwable t) {
        log.warn("Falling back for doctor appointments due to: {}", t.getMessage());
        return List.of(); 
    }

    public AppointmentResponse confirmAppointment(String id) {
        if (id == null) throw new IllegalArgumentException("Appointment ID cannot be null");
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
        appointment.setStatus(AppointmentStatus.CONFIRMED);
        return appointmentMapper.toResponse(appointmentRepository.save(appointment));
    }

    public AppointmentResponse cancelAppointment(String id) {
        if (id == null) throw new IllegalArgumentException("Appointment ID cannot be null");
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
        appointment.setStatus(AppointmentStatus.CANCELLED);
        
        // Publish event
        eventProducer.publishCancelledEvent(AppointmentEvent.builder()
                .appointmentId(appointment.getId())
                .patientId(appointment.getPatientId())
                .doctorId(appointment.getDoctorId())
                .status(AppointmentStatus.CANCELLED)
                .type("CANCELLED")
                .build());

        return appointmentMapper.toResponse(appointmentRepository.save(appointment));
    }

    public AppointmentResponse completeAppointment(String id, String prescription) {
        if (id == null) throw new IllegalArgumentException("Appointment ID cannot be null");
        Appointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));
        appointment.setStatus(AppointmentStatus.COMPLETED);
        appointment.setPrescription(prescription);

        // Publish event
        eventProducer.publishCompletedEvent(AppointmentEvent.builder()
                .appointmentId(appointment.getId())
                .patientId(appointment.getPatientId())
                .doctorId(appointment.getDoctorId())
                .status(AppointmentStatus.COMPLETED)
                .type("COMPLETED")
                .build());

        return appointmentMapper.toResponse(appointmentRepository.save(appointment));
    }
}
