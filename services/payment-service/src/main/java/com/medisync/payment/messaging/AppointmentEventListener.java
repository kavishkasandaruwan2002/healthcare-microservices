package com.medisync.payment.messaging;

import com.medisync.payment.entity.Payment;
import com.medisync.payment.enums.PaymentStatus;
import com.medisync.payment.messaging.event.AppointmentConfirmedEvent;
import com.medisync.payment.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import static com.medisync.payment.config.RabbitMQConfig.PAYMENT_APPOINTMENT_CONFIRMED_QUEUE;

@Slf4j
@Component
@RequiredArgsConstructor
public class AppointmentEventListener {

    private final PaymentRepository paymentRepository;

    @RabbitListener(queues = PAYMENT_APPOINTMENT_CONFIRMED_QUEUE)
    @Transactional
    public void handleAppointmentConfirmed(AppointmentConfirmedEvent event) {
        try {
            log.info("Received appointment.confirmed event for appointment: {}", event.getAppointmentId());

            // Check if payment already exists for this appointment (idempotent)
            if (paymentRepository.findByAppointmentId(event.getAppointmentId()).isPresent()) {
                log.warn("Payment already exists for appointment: {}, skipping", event.getAppointmentId());
                return;
            }

            // Create Payment record with status PENDING
            Payment payment = Payment.builder()
                    .appointmentId(event.getAppointmentId())
                    .patientId(event.getPatientId())
                    .doctorId(event.getDoctorId())
                    .amount(event.getConsultationFee())
                    .currency(event.getCurrency())
                    .status(PaymentStatus.PENDING)
                    .description("Consultation fee - " + event.getDoctorName())
                    .stripePaymentIntentId("")
                    .stripeClientSecret("")
                    .build();

            paymentRepository.save(payment);
            log.info("Created PENDING payment record for appointment: {}, paymentId: {}", 
                    event.getAppointmentId(), payment.getPaymentId());

        } catch (Exception ex) {
            log.error("Error processing appointment.confirmed event for appointment: {}", 
                    event.getAppointmentId(), ex);
            // Never rethrow - log and continue
        }
    }
}
