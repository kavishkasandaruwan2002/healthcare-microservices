package com.medisync.telemedicine.config;
import com.medisync.telemedicine.enums.SessionStatus;
import com.medisync.telemedicine.repository.SessionRepository;
import io.micrometer.core.instrument.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MetricsConfig {
    @Bean public Counter sessionsCreatedCounter(MeterRegistry registry){ return Counter.builder("telemedicine.sessions.created").description("Total sessions created").register(registry); }
    @Bean public Counter tokensGeneratedCounter(MeterRegistry registry){ return Counter.builder("telemedicine.tokens.generated").description("Total Agora tokens generated").register(registry); }
    @Bean public Counter sessionsEndedCounter(MeterRegistry registry){ return Counter.builder("telemedicine.sessions.ended").description("Total sessions ended").register(registry); }
    @Bean public Gauge activeSessionsGauge(MeterRegistry registry, SessionRepository repository){ return Gauge.builder("telemedicine.sessions.active", repository, r -> r.countByStatus(SessionStatus.ACTIVE)).description("Currently active sessions").register(registry); }
}
