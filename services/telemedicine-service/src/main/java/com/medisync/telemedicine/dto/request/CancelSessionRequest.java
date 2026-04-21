package com.medisync.telemedicine.dto.request;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
@Data public class CancelSessionRequest { @NotBlank private String reason; }
