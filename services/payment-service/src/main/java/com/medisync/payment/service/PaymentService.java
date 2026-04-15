package com.medisync.payment.service;

import com.medisync.payment.dto.request.RefundRequest;
import com.medisync.payment.dto.response.PaymentInitiateResponse;
import com.medisync.payment.dto.response.PaymentResponse;
import com.medisync.payment.dto.response.PaymentStatsResponse;
import com.medisync.payment.dto.response.RefundResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;
import com.stripe.exception.SignatureVerificationException;

public interface PaymentService {

    PaymentInitiateResponse initiatePayment(UUID appointmentId, UUID patientId);

    PaymentResponse getPaymentById(UUID paymentId, UUID userId, String role);

    PaymentResponse getPaymentByAppointmentId(UUID appointmentId, UUID userId, String role);

    Page<PaymentResponse> getMyPayments(UUID patientId, String status, Pageable pageable);

    Page<PaymentResponse> getAllPayments(String status, UUID patientId, Pageable pageable);

    PaymentStatsResponse getPaymentStats();

    RefundResponse issueRefund(UUID paymentId, RefundRequest refundRequest);

    void handleWebhook(String payload, String signature) throws SignatureVerificationException;
}
