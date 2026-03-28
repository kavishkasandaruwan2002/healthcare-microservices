package com.healthcare.patient.service;

import com.healthcare.patient.dto.AuthResponse;
import com.healthcare.patient.dto.LoginRequest;
import com.healthcare.patient.dto.RegisterRequest;
import com.healthcare.patient.model.Patient;
import com.healthcare.patient.repository.PatientRepository;
import com.healthcare.patient.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Collections;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final PatientRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthResponse register(RegisterRequest request) {
        if (repository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        Patient patient = Patient.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .age(request.getAge())
                .gender(request.getGender())
                .address(request.getAddress())
                .role("ROLE_PATIENT")
                .build();

        repository.save(patient);

        org.springframework.security.core.userdetails.UserDetails userDetails = new User(
                patient.getEmail(),
                patient.getPassword(),
                Collections.singletonList(new SimpleGrantedAuthority(patient.getRole()))
        );

        String jwtToken = jwtService.generateToken(userDetails);
        return AuthResponse.builder()
                .token(jwtToken)
                .patientId(patient.getId())
                .email(patient.getEmail())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        Patient patient = repository.findByEmail(request.getEmail())
                .orElseThrow();

        org.springframework.security.core.userdetails.UserDetails userDetails = new User(
                patient.getEmail(),
                patient.getPassword(),
                Collections.singletonList(new SimpleGrantedAuthority(patient.getRole()))
        );

        String jwtToken = jwtService.generateToken(userDetails);
        return AuthResponse.builder()
                .token(jwtToken)
                .patientId(patient.getId())
                .email(patient.getEmail())
                .build();
    }
}
