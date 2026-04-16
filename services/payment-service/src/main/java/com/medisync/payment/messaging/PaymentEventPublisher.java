package com.medisync.payment.messaging;

import com.medisync.payment.entity.Payment;
import com.medisync.payment.messaging.event.PaymentEventPayload;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentEventPublisher {

    private final RabbitTemplate rabbitTemplate;
    private static final String EXCHANGE = "payment.exchange";

    public void publishPaymentCompleted(Payment payment) {
        PaymentEventPayload payload = buildPayload(payment, "SUCCESS");
        log.info("Publishing payment.completed event for payment: {}", payment.getPaymentId());
        rabbitTemplate.convertAndSend(EXCHANGE, "payment.completed", payload);
    }

    public void publishPaymentFailed(Payment payment) {
        PaymentEventPayload payload = buildPayload(payment, "FAILED");
        log.info("Publishing payment.failed event for payment: {}", payment.getPaymentId());
        rabbitTemplate.convertAndSend(EXCHANGE, "payment.failed", payload);
    }

    private PaymentEventPayload buildPayload(Payment payment, String status) {
        return PaymentEventPayload.builder()
                .paymentId(payment.getPaymentId())
                .appointmentId(payment.getAppointmentId())
                .patientId(payment.getPatientId())
                .doctorId(payment.getDoctorId())
                .amount(payment.getAmount())
                .currency(payment.getCurrency())
                .status(status)
                .stripePaymentIntentId(payment.getStripePaymentIntentId())
                .failureReason(payment.getFailureReason())
                .build();
    }
}
