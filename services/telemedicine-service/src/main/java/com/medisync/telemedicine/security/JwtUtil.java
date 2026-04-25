package com.medisync.telemedicine.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;

@Component
public class JwtUtil {
    @Value("${jwt.secret}") private String secret;
    private SecretKey key(){ 
        byte[] keyBytes = io.jsonwebtoken.io.Decoders.BASE64.decode(secret);
        return Keys.hmacShaKeyFor(keyBytes); 
    }
    private Claims claims(String token){ return Jwts.parserBuilder().setSigningKey(key()).build().parseClaimsJws(token).getBody(); }
    public String extractUserId(String token){ return claims(token).get("userId", String.class); }
    public String extractRole(String token){ return claims(token).get("role", String.class); }
    public boolean validateToken(String token){ try{ claims(token); return true;}catch(Exception ex){ return false; } }
}
