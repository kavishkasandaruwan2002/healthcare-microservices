package com.medisync.payment.service;

import com.medisync.payment.dto.request.RefundRequest;
import com.medisync.payment.dto.response.PaymentInitiateResponse;
import com.medisync.payment.dto.response.PaymentResponse;
import com.medisync.payment.dto.response.PaymentStatsResponse;
import com.medisync.payment.dto.response.RefundResponse;
import com.stripe.exception.StripeException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface PaymentService {
    PaymentInitiateResponse initiatePayment(String appointmentId, String patientId);
    void handleWebhook(String payload, String sigHeader) throws com.stripe.exception.SignatureVerificationException;
    PaymentResponse getPaymentById(UUID paymentId, String userId, String role);
    PaymentResponse getPaymentByAppointmentId(String appointmentId, String userId, String role);
    Page<PaymentResponse> getMyPayments(String patientId, String status, Pageable pageable);
    RefundResponse issueRefund(UUID paymentId, RefundRequest request);
    Page<PaymentResponse> getAllPayments(String status, String patientId, Pageable pageable);
    PaymentStatsResponse getPaymentStats();
}
