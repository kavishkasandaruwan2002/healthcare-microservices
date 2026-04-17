package com.medisync.telemedicine.config;

import com.medisync.telemedicine.security.JwtAuthFilter;
import com.medisync.telemedicine.security.ServiceAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final ServiceAuthFilter serviceAuthFilter;
    private final JwtAuthFilter jwtAuthFilter;


    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http.csrf(csrf -> csrf.disable())
                .cors(cors -> cors.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(e -> e.authenticationEntryPoint(new org.springframework.security.web.authentication.HttpStatusEntryPoint(org.springframework.http.HttpStatus.UNAUTHORIZED)))
                .authorizeHttpRequests(a -> a
                        // CRITICAL: Preflight MUST be permitted
                        .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/actuator/**", "/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**")
                        .permitAll()
                        .anyRequest().authenticated())
                .addFilterBefore(serviceAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterAfter(jwtAuthFilter, ServiceAuthFilter.class)
                .build();
    }
}
