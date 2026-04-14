package com.healthcare.doctor.service;

import com.healthcare.doctor.client.NotificationClient;
import com.healthcare.doctor.dto.DoctorAuthResponse;
import com.healthcare.doctor.dto.DoctorDTO;
import com.healthcare.doctor.dto.DoctorRegisterRequest;
import com.healthcare.doctor.model.Doctor;
import com.healthcare.doctor.repository.DoctorRepository;
import com.healthcare.doctor.security.DoctorJwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.security.core.userdetails.User;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DoctorService {

    private final DoctorRepository doctorRepository;
    private final PasswordEncoder passwordEncoder;
    private final DoctorJwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final NotificationClient notificationClient;

    public DoctorAuthResponse register(DoctorRegisterRequest request) {
        if (doctorRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        Doctor doctor = Doctor.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .specialization(request.getSpecialization())
                .licenseNumber(request.getLicenseNumber())
                .bio(request.getBio())
                .consultationFee(request.getConsultationFee())
                .yearsOfExperience(request.getYearsOfExperience())
                .qualification(request.getQualification())
                .hospitalAffiliation(request.getHospitalAffiliation())
                .status("PENDING")
                .isVerified(false)
                .role("ROLE_DOCTOR")
                .createdAt(System.currentTimeMillis())
                .updatedAt(System.currentTimeMillis())
                .build();

        Doctor savedDoctor = doctorRepository.save(doctor);
        log.info("Doctor registered successfully: {}", savedDoctor.getEmail());

        // Send registration confirmation email
        try {
            notificationClient.sendDoctorRegistrationEmail(
                    savedDoctor.getEmail(),
                    savedDoctor.getId(),
                    savedDoctor.getName(),
                    savedDoctor.getSpecialization() != null ? savedDoctor.getSpecialization() : ""
            );
            log.info("Registration email sent to: {}", savedDoctor.getEmail());
        } catch (Exception ex) {
            log.warn("Failed to send registration email to: {} – {}", savedDoctor.getEmail(), ex.getMessage());
        }

        User userDetails = new User(
                savedDoctor.getEmail(),
                savedDoctor.getPassword(),
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_DOCTOR")));

        String jwtToken = jwtService.generateToken(userDetails);
        DoctorDTO doctorDTO = mapToDTO(savedDoctor);

        return DoctorAuthResponse.builder()
                .token(jwtToken)
                .doctor(doctorDTO)
                .build();
    }

    public DoctorAuthResponse login(String email, String password) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, password));

            Doctor doctor = doctorRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Doctor not found"));

            User userDetails = new User(
                    doctor.getEmail(),
                    doctor.getPassword(),
                    Collections.singletonList(new SimpleGrantedAuthority("ROLE_DOCTOR")));

            String jwtToken = jwtService.generateToken(userDetails);
            DoctorDTO doctorDTO = mapToDTO(doctor);

            log.info("Doctor logged in successfully: {}", email);

            return DoctorAuthResponse.builder()
                    .token(jwtToken)
                    .doctor(doctorDTO)
                    .build();
        } catch (Exception e) {
            log.error("Login failed for doctor: {}", email, e);
            throw new RuntimeException("Invalid credentials");
        }
    }

    public Doctor getDoctorById(String id) {
        return doctorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));
    }

    // New method that returns DTO for frontend
    public DoctorDTO getDoctorByIdDTO(String id) {
        Doctor doctor = getDoctorById(id);
        return mapToDTO(doctor);
    }

    public List<DoctorDTO> getDoctorsBySpecialization(String specialization) {
        log.info("Fetching doctors by specialization: {}", specialization);
        return doctorRepository.findBySpecialization(specialization)
                .stream()
                .filter(doctor -> doctor.getIsVerified() != null && doctor.getIsVerified())
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public List<DoctorDTO> getAllVerifiedDoctors() {
        log.info("Fetching all verified doctors");
        return doctorRepository.findByIsVerified(true)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public DoctorDTO updateDoctor(String id, Doctor updatedDoctor) {
        Doctor doctor = getDoctorById(id);

        if (updatedDoctor.getName() != null) {
            doctor.setName(updatedDoctor.getName());
        }
        if (updatedDoctor.getPhone() != null) {
            doctor.setPhone(updatedDoctor.getPhone());
        }
        if (updatedDoctor.getBio() != null) {
            doctor.setBio(updatedDoctor.getBio());
        }
        if (updatedDoctor.getConsultationFee() != null) {
            doctor.setConsultationFee(updatedDoctor.getConsultationFee());
        }
        if (updatedDoctor.getAvailability() != null) {
            doctor.setAvailability(updatedDoctor.getAvailability());
        }

        if (updatedDoctor.getAvailabilitySlots() != null) {
            doctor.setAvailabilitySlots(updatedDoctor.getAvailabilitySlots());
        }

        doctor.setUpdatedAt(System.currentTimeMillis());

        Doctor saved = doctorRepository.save(doctor);
        log.info("Doctor updated: {}", id);
        return mapToDTO(saved);
    }

    public DoctorDTO addAvailabilitySlot(String id, com.healthcare.doctor.model.AvailabilitySlot slot) {
        Doctor doctor = getDoctorById(id);
        if (doctor.getAvailabilitySlots() == null) {
            doctor.setAvailabilitySlots(new java.util.ArrayList<>());
        }
        doctor.getAvailabilitySlots().add(slot);
        doctor.setUpdatedAt(System.currentTimeMillis());
        Doctor saved = doctorRepository.save(doctor);
        return mapToDTO(saved);
    }

    public void updateDoctorStatus(String id, String status) {
        updateDoctorStatus(id, status, null);
    }

    public void updateDoctorStatus(String id, String status, String rejectionReason) {
        Doctor doctor = getDoctorById(id);
        doctor.setStatus(status);
        if ("APPROVED".equals(status)) {
            doctor.setIsVerified(true);
        }
        doctor.setUpdatedAt(System.currentTimeMillis());
        doctorRepository.save(doctor);
        log.info("Doctor status updated: {} -> {}", id, status);

        // Send status-change email notification
        try {
            String specialization = doctor.getSpecialization() != null ? doctor.getSpecialization() : "";
            if ("APPROVED".equals(status)) {
                notificationClient.sendDoctorApprovedEmail(
                        doctor.getEmail(), doctor.getId(), doctor.getName(), specialization);
                log.info("Approval email sent to: {}", doctor.getEmail());
            } else if ("REJECTED".equals(status)) {
                String reason = rejectionReason != null ? rejectionReason
                        : "Your application did not meet our current requirements.";
                notificationClient.sendDoctorRejectedEmail(
                        doctor.getEmail(), doctor.getId(), doctor.getName(), reason);
                log.info("Rejection email sent to: {}", doctor.getEmail());
            }
        } catch (Exception ex) {
            log.warn("Failed to send status email to: {} – {}", doctor.getEmail(), ex.getMessage());
        }
    }

    public List<DoctorDTO> getPendingDoctors() {
        log.info("Fetching pending doctors");
        return doctorRepository.findByStatus("PENDING")
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    private DoctorDTO mapToDTO(Doctor doctor) {
        if (doctor == null) {
            return null;
        }

        return DoctorDTO.builder()
                .id(doctor.getId())
                .name(doctor.getName())
                .email(doctor.getEmail())
                .phone(doctor.getPhone())
                .specialization(doctor.getSpecialization())
                .bio(doctor.getBio())
                .consultationFee(doctor.getConsultationFee())
                .status(doctor.getStatus())
                .yearsOfExperience(doctor.getYearsOfExperience())
                .qualification(doctor.getQualification())
                .hospitalAffiliation(doctor.getHospitalAffiliation())
                .isVerified(doctor.getIsVerified())
                .role(doctor.getRole())
                .availabilitySlots(doctor.getAvailabilitySlots())
                .build();
    }
}
