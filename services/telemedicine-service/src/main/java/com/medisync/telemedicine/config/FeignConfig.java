package com.medisync.telemedicine.config;
import feign.RequestInterceptor;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Configuration
public class FeignConfig {
    @Bean
    public RequestInterceptor authForwardInterceptor(){
        return template -> {
            RequestAttributes attrs = RequestContextHolder.getRequestAttributes();
            if(attrs instanceof ServletRequestAttributes sra){
                HttpServletRequest req = sra.getRequest();
                String auth = req.getHeader("Authorization");
                if(auth != null && !auth.isBlank()) template.header("Authorization", auth);
            }
        };
    }
}
