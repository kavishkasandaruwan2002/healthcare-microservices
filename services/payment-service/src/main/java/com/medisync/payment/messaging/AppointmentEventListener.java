package com.medisync.payment.messaging;

import com.medisync.payment.entity.Payment;
import com.medisync.payment.enums.PaymentStatus;
import com.medisync.payment.messaging.event.AppointmentConfirmedEvent;
import com.medisync.payment.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class AppointmentEventListener {

    private final PaymentRepository paymentRepository;

    @RabbitListener(queues = "payment.appointment.confirmed")
    public void handleAppointmentConfirmed(AppointmentConfirmedEvent event) {
        log.info("Received appointment.confirmed event for appointment: {}", event.getAppointmentId());

        try {
            if (paymentRepository.findByAppointmentId(event.getAppointmentId()).isPresent()) {
                log.warn("Payment record already exists for appointment: {}. Skipping.", event.getAppointmentId());
                return;
            }

            Payment payment = Payment.builder()
                    .appointmentId(event.getAppointmentId())
                    .patientId(event.getPatientId())
                    .doctorId(event.getDoctorId())
                    .amount(event.getConsultationFee())
                    .currency(event.getCurrency())
                    .status(PaymentStatus.PENDING)
                    .description("Consultation fee - " + event.getDoctorName())
                    .build();

            paymentRepository.save(payment);
            log.info("Created PENDING payment for appointment: {}", event.getAppointmentId());
            
        } catch (Exception e) {
            log.error("Error processing appointment confirmed event", e);
        }
    }
}
