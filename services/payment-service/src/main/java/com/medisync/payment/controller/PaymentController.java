package com.medisync.payment.controller;

import com.medisync.payment.dto.request.RefundRequest;
import com.medisync.payment.dto.response.PaymentInitiateResponse;
import com.medisync.payment.dto.response.PaymentResponse;
import com.medisync.payment.dto.response.PaymentStatsResponse;
import com.medisync.payment.dto.response.RefundResponse;
import com.medisync.payment.security.UserPrincipal;
import com.medisync.payment.security.UserPrincipal;
import com.medisync.payment.service.PaymentService;
import com.stripe.exception.SignatureVerificationException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/payments")
@RequiredArgsConstructor
@Tag(name = "Payment", description = "Payment management APIs")
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/initiate")
    @PreAuthorize("hasRole('PATIENT')")
    @Operation(summary = "Initiate a payment", description = "Creates a Stripe PaymentIntent and returns clientSecret to frontend")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Payment initiated successfully",
            content = @Content(schema = @Schema(implementation = PaymentInitiateResponse.class))),
        @ApiResponse(responseCode = "404", description = "Appointment not found"),
        @ApiResponse(responseCode = "409", description = "Payment already completed")
    })
    public ResponseEntity<PaymentInitiateResponse> initiatePayment(
            @Valid @RequestBody InitiatePaymentRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("Initiating payment for appointment: {}, patient: {}",
                request.getAppointmentId(), userPrincipal.getUserId());

        PaymentInitiateResponse response = paymentService.initiatePayment(
                request.getAppointmentId(),
                UUID.fromString(userPrincipal.getUserId()));

        return ResponseEntity.ok(response);
    }

    @PostMapping("/webhook")
    @Operation(summary = "Stripe webhook endpoint", description = "Handles Stripe webhook events")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Webhook received"),
        @ApiResponse(responseCode = "400", description = "Invalid signature")
    })
    public ResponseEntity<WebhookResponse> handleStripeWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String stripeSignature) {

        log.info("Received Stripe webhook");
        try {
            paymentService.handleWebhook(payload, stripeSignature);
            return ResponseEntity.ok(new WebhookResponse(true));
        } catch (SignatureVerificationException e) {
            log.error("Invalid webhook signature", e);
            return ResponseEntity.badRequest().body(new WebhookResponse(false));
        }
    }

    @GetMapping("/{paymentId}")
    @Operation(summary = "Get payment by ID", description = "Retrieve payment details by payment ID")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Payment found",
            content = @Content(schema = @Schema(implementation = PaymentResponse.class))),
        @ApiResponse(responseCode = "404", description = "Payment not found"),
        @ApiResponse(responseCode = "403", description = "Access denied")
    })
    public ResponseEntity<PaymentResponse> getPaymentById(
            @PathVariable UUID paymentId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("Getting payment: {} for user: {}", paymentId, userPrincipal.getUserId());

        PaymentResponse response = paymentService.getPaymentById(
                paymentId,
                UUID.fromString(userPrincipal.getUserId()),
                userPrincipal.getRole());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/appointment/{appointmentId}")
    @Operation(summary = "Get payment by appointment ID", description = "Retrieve payment details by appointment ID")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Payment found",
            content = @Content(schema = @Schema(implementation = PaymentResponse.class))),
        @ApiResponse(responseCode = "404", description = "Payment not found"),
        @ApiResponse(responseCode = "403", description = "Access denied")
    })
    public ResponseEntity<PaymentResponse> getPaymentByAppointmentId(
            @PathVariable UUID appointmentId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("Getting payment for appointment: {} for user: {}",
                appointmentId, userPrincipal.getUserId());

        PaymentResponse response = paymentService.getPaymentByAppointmentId(
                appointmentId,
                UUID.fromString(userPrincipal.getUserId()),
                userPrincipal.getRole());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/my-payments")
    @PreAuthorize("hasRole('PATIENT')")
    @Operation(summary = "Get my payments", description = "Retrieve all payments for the authenticated patient")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Payments retrieved successfully",
            content = @Content(schema = @Schema(implementation = PaymentResponse.class)))
    })
    public ResponseEntity<Page<PaymentResponse>> getMyPayments(
            @RequestParam(required = false) String status,
            @PageableDefault(size = 10) Pageable pageable,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        log.info("Getting payments for patient: {}", userPrincipal.getUserId());

        Page<PaymentResponse> response = paymentService.getMyPayments(
                UUID.fromString(userPrincipal.getUserId()),
                status,
                pageable);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{paymentId}/refund")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Issue a refund", description = "Issue a full or partial refund for a payment")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Refund issued successfully",
            content = @Content(schema = @Schema(implementation = RefundResponse.class))),
        @ApiResponse(responseCode = "404", description = "Payment not found"),
        @ApiResponse(responseCode = "409", description = "Payment cannot be refunded")
    })
    public ResponseEntity<RefundResponse> issueRefund(
            @PathVariable UUID paymentId,
            @Valid @RequestBody(required = false) RefundRequest refundRequest) {

        log.info("Issuing refund for payment: {}", paymentId);

        if (refundRequest == null) {
            refundRequest = new RefundRequest(null, "Refund requested");
        }

        RefundResponse response = paymentService.issueRefund(paymentId, refundRequest);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List all payments", description = "Retrieve all payments with optional filters")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Payments retrieved successfully",
            content = @Content(schema = @Schema(implementation = PaymentResponse.class)))
    })
    public ResponseEntity<Page<PaymentResponse>> getAllPayments(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) UUID patientId,
            @PageableDefault(size = 20) Pageable pageable) {

        log.info("Getting all payments with filters: status={}, patientId={}", status, patientId);

        Page<PaymentResponse> response = paymentService.getAllPayments(status, patientId, pageable);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get payment statistics", description = "Retrieve payment statistics and total revenue")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Statistics retrieved successfully",
            content = @Content(schema = @Schema(implementation = PaymentStatsResponse.class)))
    })
    public ResponseEntity<PaymentStatsResponse> getPaymentStats() {
        log.info("Getting payment statistics");
        PaymentStatsResponse response = paymentService.getPaymentStats();
        return ResponseEntity.ok(response);
    }

    // Inner classes for request/response
    public static class InitiatePaymentRequest {
        private UUID appointmentId;

        public UUID getAppointmentId() { return appointmentId; }
        public void setAppointmentId(UUID appointmentId) { this.appointmentId = appointmentId; }
    }

    public static class WebhookResponse {
        private boolean received;

        public WebhookResponse(boolean received) { this.received = received; }
        public boolean isReceived() { return received; }
        public void setReceived(boolean received) { this.received = received; }
    }
}
