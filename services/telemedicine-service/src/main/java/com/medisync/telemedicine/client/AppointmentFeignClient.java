package com.medisync.telemedicine.client;
import com.medisync.telemedicine.client.dto.AppointmentDetails;
import com.medisync.telemedicine.config.FeignConfig;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import java.util.UUID;
@FeignClient(name = "appointment-service", path = "/api/v1/appointments", configuration = FeignConfig.class)
public interface AppointmentFeignClient { @GetMapping("/{appointmentId}") AppointmentDetails getAppointmentById(@PathVariable UUID appointmentId); }
