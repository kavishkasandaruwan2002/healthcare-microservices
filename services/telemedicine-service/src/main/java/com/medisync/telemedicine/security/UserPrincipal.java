package com.medisync.telemedicine.security;
import lombok.*;
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class UserPrincipal {
    private String userId;
    private String role;
    public boolean isAdmin(){ return "ADMIN".equals(role); }
    public boolean isDoctor(){ return "DOCTOR".equals(role); }
    public boolean isPatient(){ return "PATIENT".equals(role); }
}
