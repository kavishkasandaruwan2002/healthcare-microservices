package com.medisync.payment.config;

import com.medisync.payment.security.UserPrincipal;
import org.springframework.lang.NonNull;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@TestConfiguration
@EnableWebSecurity
@EnableMethodSecurity
public class TestSecurityConfig {
    @Bean
    public SecurityFilterChain testFilterChain(HttpSecurity http) throws Exception {
        http.csrf(AbstractHttpConfigurer::disable)
            .authorizeHttpRequests(auth -> auth.anyRequest().permitAll())
            .addFilterBefore(new OncePerRequestFilter() {
                @Override
                protected void doFilterInternal(@NonNull HttpServletRequest request, @NonNull HttpServletResponse response, @NonNull FilterChain filterChain) throws ServletException, IOException {
                    var auth = SecurityContextHolder.getContext().getAuthentication();
                    if (auth != null && auth.getAuthorities() != null && !auth.getAuthorities().isEmpty()) {
                        String role = auth.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "");
                        String username = auth.getName();
                        if (username == null || username.equals("user") || !username.contains("-")) {
                            username = UUID.randomUUID().toString();
                        }
                        UserPrincipal userPrincipal = new UserPrincipal(username, role);
                        UsernamePasswordAuthenticationToken newAuth = new UsernamePasswordAuthenticationToken(userPrincipal, null, userPrincipal.getAuthorities());
                        SecurityContextHolder.getContext().setAuthentication(newAuth);
                    }
                    filterChain.doFilter(request, response);
                }
            }, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
