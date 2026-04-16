package com.medisync.payment.messaging;

import com.medisync.payment.entity.Payment;
import com.medisync.payment.messaging.event.PaymentEventPayload;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

import static com.medisync.payment.config.RabbitMQConfig.PAYMENT_COMPLETED_ROUTING_KEY;
import static com.medisync.payment.config.RabbitMQConfig.PAYMENT_EXCHANGE;
import static com.medisync.payment.config.RabbitMQConfig.PAYMENT_FAILED_ROUTING_KEY;

@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    public void publishPaymentCompleted(Payment payment) {
        PaymentEventPayload payload = PaymentEventPayload.builder()
                .paymentId(payment.getPaymentId())
                .appointmentId(payment.getAppointmentId())
                .patientId(payment.getPatientId())
                .doctorId(payment.getDoctorId())
                .amount(payment.getAmount())
                .currency(payment.getCurrency())
                .status(payment.getStatus())
                .stripePaymentIntentId(payment.getStripePaymentIntentId())
                .failureReason(null)
                .build();

        log.info("Publishing payment.completed event for payment: {}", payment.getPaymentId());
        rabbitTemplate.convertAndSend(PAYMENT_EXCHANGE, PAYMENT_COMPLETED_ROUTING_KEY, payload);
    }

    public void publishPaymentFailed(Payment payment) {
        PaymentEventPayload payload = PaymentEventPayload.builder()
                .paymentId(payment.getPaymentId())
                .appointmentId(payment.getAppointmentId())
                .patientId(payment.getPatientId())
                .doctorId(payment.getDoctorId())
                .amount(payment.getAmount())
                .currency(payment.getCurrency())
                .status(payment.getStatus())
                .stripePaymentIntentId(payment.getStripePaymentIntentId())
                .failureReason(payment.getFailureReason())
                .build();

        log.info("Publishing payment.failed event for payment: {}", payment.getPaymentId());
        rabbitTemplate.convertAndSend(PAYMENT_EXCHANGE, PAYMENT_FAILED_ROUTING_KEY, payload);
    }
}
