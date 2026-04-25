package com.healthcare.appointment.repository;

import com.healthcare.appointment.entity.Appointment;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AppointmentRepository extends MongoRepository<Appointment, String> {

    List<Appointment> findByPatientId(String patientId);

    List<Appointment> findByDoctorId(String doctorId);

    @Query("{ 'doctorId': ?0, 'appointmentTime': { $gte: ?1, $lte: ?2 } }")
    List<Appointment> findConflicts(String doctorId, LocalDateTime start, LocalDateTime end);

    @Query("{ 'doctorId': ?0, 'status': 'CONFIRMED', 'appointmentTime': { $gte: ?1 } }")
    List<Appointment> findUpcomingByDoctor(String doctorId, LocalDateTime now);
}
