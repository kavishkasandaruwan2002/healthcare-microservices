package com.healthcare.patient.service;

import com.healthcare.patient.dto.AuthResponse;
import com.healthcare.patient.dto.LoginRequest;
import com.healthcare.patient.dto.RegisterRequest;
import com.healthcare.patient.dto.UserDto;
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
import lombok.extern.slf4j.Slf4j;

import java.util.Collections;
import com.healthcare.patient.exception.EmailAlreadyExistsException;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

        private final PatientRepository repository;
        private final PasswordEncoder passwordEncoder;
        private final JwtService jwtService;
        private final AuthenticationManager authenticationManager;

        public AuthResponse register(RegisterRequest request) {
                if (repository.existsByEmail(request.getEmail())) {
                        throw new EmailAlreadyExistsException("Email already exists");
                }

                String role = request.getRole() != null ? request.getRole() : "PATIENT";
                if (!role.startsWith("ROLE_")) {
                        role = "ROLE_" + role.toUpperCase();
                }

                Patient patient = Patient.builder()
                                .name(request.getName())
                                .email(request.getEmail())
                                .password(passwordEncoder.encode(request.getPassword()))
                                .phone(request.getPhone())
                                .age(request.getAge())
                                .gender(request.getGender())
                                .address(request.getAddress())
                                .role(role)
                                .build();

                log.info("Attempting to save new patient with email: {}", patient.getEmail());
                Patient savedPatient = repository.save(patient);
                log.info("Patient saved successfully with ID: {}", savedPatient.getId());

                org.springframework.security.core.userdetails.UserDetails userDetails = new User(
                                savedPatient.getEmail(),
                                savedPatient.getPassword(),
                                Collections.singletonList(new SimpleGrantedAuthority(savedPatient.getRole())));

                String jwtToken = jwtService.generateToken(userDetails);
                UserDto userDto = UserDto.builder()
                                .id(savedPatient.getId())
                                .email(savedPatient.getEmail())
                                .name(savedPatient.getName())
                                .role(savedPatient.getRole())
                                .build();

                return AuthResponse.builder()
                                .token(jwtToken)
                                .user(userDto)
                                .build();
        }

        public AuthResponse login(LoginRequest request) {
                authenticationManager.authenticate(
                                new UsernamePasswordAuthenticationToken(
                                                request.getEmail(),
                                                request.getPassword()));

                Patient patient = repository.findByEmail(request.getEmail())
                                .orElseThrow();

                org.springframework.security.core.userdetails.UserDetails userDetails = new User(
                                patient.getEmail(),
                                patient.getPassword(),
                                Collections.singletonList(new SimpleGrantedAuthority(patient.getRole())));

                String jwtToken = jwtService.generateToken(userDetails);
                UserDto userDto = UserDto.builder()
                                .id(patient.getId())
                                .email(patient.getEmail())
                                .name(patient.getName())
                                .role(patient.getRole())
                                .build();

                return AuthResponse.builder()
                                .token(jwtToken)
                                .user(userDto)
                                .build();
        }
}
