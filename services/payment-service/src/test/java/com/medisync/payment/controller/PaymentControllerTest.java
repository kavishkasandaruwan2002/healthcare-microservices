package com.medisync.payment.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medisync.payment.dto.request.RefundRequest;
import com.medisync.payment.dto.response.PaymentInitiateResponse;
import com.medisync.payment.dto.response.PaymentResponse;
import com.medisync.payment.dto.response.PaymentStatsResponse;
import com.medisync.payment.dto.response.RefundResponse;
import com.medisync.payment.enums.PaymentStatus;
import com.medisync.payment.enums.RefundStatus;
import com.medisync.payment.exception.PaymentNotFoundException;
import com.medisync.payment.security.JwtUtil;
import com.medisync.payment.service.PaymentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.springframework.test.context.ActiveProfiles;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Import;
import com.medisync.payment.config.TestSecurityConfig;
import com.medisync.payment.security.SecurityConfig;
import org.springframework.data.jpa.mapping.JpaMetamodelMappingContext;

@WebMvcTest(
    controllers = PaymentController.class,
    excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = SecurityConfig.class)
)
@ActiveProfiles("test")
@Import(TestSecurityConfig.class)
class PaymentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PaymentService paymentService;

    @MockBean
    private JwtUtil jwtUtil;

    @MockBean
    private JpaMetamodelMappingContext jpaMappingContext;

    private UUID paymentId;
    private UUID appointmentId;
    private UUID patientId;

    @BeforeEach
    void setUp() {
        paymentId = UUID.randomUUID();
        appointmentId = UUID.randomUUID();
        patientId = UUID.randomUUID();
    }

    @Test
    @WithMockUser(roles = "PATIENT")
    void initiatePayment_asPatient_returns200() throws Exception {
        PaymentInitiateResponse response = PaymentInitiateResponse.builder()
                .paymentId(paymentId)
                .clientSecret("pi_test_secret_abc")
                .amount(BigDecimal.valueOf(25.00))
                .currency("USD")
                .status(PaymentStatus.PENDING)
                .stripePublishableKey("pk_test_123")
                .build();

        when(paymentService.initiatePayment(eq(appointmentId), any())).thenReturn(response);

        mockMvc.perform(post("/api/v1/payments/initiate")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"appointmentId\":\"" + appointmentId + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.clientSecret").value("pi_test_secret_abc"));
    }

    @Test
    @WithMockUser(roles = "DOCTOR")
    void initiatePayment_asDoctor_returns403() throws Exception {
        mockMvc.perform(post("/api/v1/payments/initiate")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"appointmentId\":\"" + appointmentId + "\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void webhook_validSignature_returns200() throws Exception {
        String payload = "{\"id\":\"evt_123\",\"type\":\"payment_intent.succeeded\"}";
        String signature = "t=1234567890,v1=abc123";

        doNothing().when(paymentService).handleWebhook(payload, signature);

        mockMvc.perform(post("/api/v1/payments/webhook")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload)
                        .header("Stripe-Signature", signature))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.received").value(true));
    }

    @Test
    void webhook_invalidSignature_returns400() throws Exception {
        String payload = "{\"id\":\"evt_123\"}";
        String signature = "invalid_signature";

        com.stripe.exception.SignatureVerificationException ex =
                new com.stripe.exception.SignatureVerificationException("Invalid signature", "req_123");
        doThrow(ex).when(paymentService).handleWebhook(payload, signature);

        mockMvc.perform(post("/api/v1/payments/webhook")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload)
                        .header("Stripe-Signature", signature))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "PATIENT")
    void getPayment_asOwner_returns200() throws Exception {
        PaymentResponse response = PaymentResponse.builder()
                .paymentId(paymentId)
                .appointmentId(appointmentId)
                .patientId(patientId)
                .doctorId(UUID.randomUUID())
                .amount(BigDecimal.valueOf(25.00))
                .currency("USD")
                .status(PaymentStatus.SUCCESS)
                .build();

        when(paymentService.getPaymentById(eq(paymentId), any(), anyString())).thenReturn(response);

        mockMvc.perform(get("/api/v1/payments/" + paymentId)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paymentId").value(paymentId.toString()));
    }

    @Test
    @WithMockUser(roles = "PATIENT")
    void getPayment_asOtherPatient_returns404() throws Exception {
        when(paymentService.getPaymentById(any(UUID.class), any(UUID.class), anyString()))
                .thenThrow(new PaymentNotFoundException("Payment not found"));

        mockMvc.perform(get("/api/v1/payments/" + paymentId)
                        .with(csrf()))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void issueRefund_asAdmin_returns200() throws Exception {
        RefundResponse response = RefundResponse.builder()
                .refundId(UUID.randomUUID())
                .paymentId(paymentId)
                .stripeRefundId("re_test123")
                .amount(BigDecimal.valueOf(25.00))
                .status(RefundStatus.SUCCEEDED)
                .reason("Patient cancelled appointment")
                .build();

        when(paymentService.issueRefund(eq(paymentId), any(RefundRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/payments/" + paymentId + "/refund")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Patient cancelled appointment\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stripeRefundId").value("re_test123"));
    }

    @Test
    @WithMockUser(roles = "PATIENT")
    void issueRefund_asPatient_returns403() throws Exception {
        mockMvc.perform(post("/api/v1/payments/" + paymentId + "/refund")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getStats_asAdmin_returns200() throws Exception {
        PaymentStatsResponse response = PaymentStatsResponse.builder()
                .totalPayments(200)
                .successfulPayments(185)
                .failedPayments(10)
                .refundedPayments(5)
                .totalRevenue(BigDecimal.valueOf(4625.00))
                .currency("USD")
                .build();

        when(paymentService.getPaymentStats()).thenReturn(response);

        mockMvc.perform(get("/api/v1/payments/stats")
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalPayments").value(200))
                .andExpect(jsonPath("$.totalRevenue").value(4625.00));
    }

    @Test
    @WithMockUser(roles = "PATIENT")
    void getMyPayments_returns200() throws Exception {
        PaymentResponse paymentResponse = PaymentResponse.builder()
                .paymentId(paymentId)
                .appointmentId(appointmentId)
                .patientId(patientId)
                .doctorId(UUID.randomUUID())
                .amount(BigDecimal.valueOf(25.00))
                .currency("USD")
                .status(PaymentStatus.SUCCESS)
                .build();

        Page<PaymentResponse> page = new PageImpl<>(Arrays.asList(paymentResponse));
        when(paymentService.getMyPayments(any(), any(), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/v1/payments/my-payments")
                        .with(csrf())
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].paymentId").value(paymentId.toString()));
    }

    @Test
    @WithMockUser(roles = "PATIENT")
    void getPaymentByAppointmentId_asPatient_returns200() throws Exception {
        PaymentResponse response = PaymentResponse.builder()
                .paymentId(paymentId)
                .appointmentId(appointmentId)
                .patientId(patientId)
                .doctorId(UUID.randomUUID())
                .amount(BigDecimal.valueOf(25.00))
                .currency("USD")
                .status(PaymentStatus.SUCCESS)
                .build();

        when(paymentService.getPaymentByAppointmentId(eq(appointmentId), any(), anyString()))
                .thenReturn(response);

        mockMvc.perform(get("/api/v1/payments/appointment/" + appointmentId)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.appointmentId").value(appointmentId.toString()));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void getAllPayments_asAdmin_returns200() throws Exception {
        PaymentResponse paymentResponse = PaymentResponse.builder()
                .paymentId(paymentId)
                .appointmentId(appointmentId)
                .patientId(patientId)
                .doctorId(UUID.randomUUID())
                .amount(BigDecimal.valueOf(25.00))
                .currency("USD")
                .status(PaymentStatus.SUCCESS)
                .build();

        Page<PaymentResponse> page = new PageImpl<>(Arrays.asList(paymentResponse));
        when(paymentService.getAllPayments(any(), any(), any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/v1/payments")
                        .with(csrf())
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].paymentId").value(paymentId.toString()));
    }
}
