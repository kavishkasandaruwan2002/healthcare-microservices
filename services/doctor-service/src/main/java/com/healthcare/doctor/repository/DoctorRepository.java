package com.healthcare.doctor.repository;

import com.healthcare.doctor.model.Doctor;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DoctorRepository extends MongoRepository<Doctor, String> {
    Optional<Doctor> findByEmail(String email);

    Boolean existsByEmail(String email);

    List<Doctor> findBySpecialization(String specialization);

    List<Doctor> findByStatus(String status);

    List<Doctor> findByIsVerified(Boolean isVerified);
}
