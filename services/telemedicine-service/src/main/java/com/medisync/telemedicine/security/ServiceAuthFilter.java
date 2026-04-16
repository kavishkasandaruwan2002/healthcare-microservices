package com.medisync.telemedicine.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class ServiceAuthFilter extends OncePerRequestFilter {
    @Value("${service.secret}") private String serviceSecret;
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request){ return !("POST".equalsIgnoreCase(request.getMethod()) && "/api/v1/sessions/create".equals(request.getRequestURI())); }
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        String provided = request.getHeader("X-Service-Secret");
        if(serviceSecret.equals(provided)){
            var auth = new UsernamePasswordAuthenticationToken(new UserPrincipal("SERVICE","SERVICE"), null, List.of(new SimpleGrantedAuthority("ROLE_SERVICE")));
            SecurityContextHolder.getContext().setAuthentication(auth);
        }
        filterChain.doFilter(request, response);
    }
}
