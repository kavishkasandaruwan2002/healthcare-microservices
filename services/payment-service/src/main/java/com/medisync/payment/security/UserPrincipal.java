package com.medisync.payment.security;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class UserPrincipal {
    private final String userId;
    private final String role;

    public boolean isAdmin() {
        return "ADMIN".equals(role) || "ROLE_ADMIN".equals(role);
    }

    public boolean isDoctor() {
        return "DOCTOR".equals(role) || "ROLE_DOCTOR".equals(role);
    }

    public boolean isPatient() {
        return "PATIENT".equals(role) || "ROLE_PATIENT".equals(role);
    }

    public java.util.Collection<? extends org.springframework.security.core.GrantedAuthority> getAuthorities() {
        String r = role.startsWith("ROLE_") ? role : "ROLE_" + role;
        return java.util.Collections.singletonList(new org.springframework.security.core.authority.SimpleGrantedAuthority(r));
    }
}
