package com.healthcare.notification.service;

import com.healthcare.notification.dto.EmailNotificationRequest;
import com.healthcare.notification.model.Notification;
import com.healthcare.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import javax.mail.internet.MimeMessage;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final NotificationRepository notificationRepository;
    private final TemplateEngine templateEngine;

    @Value("${notification.mail.from:peirisayodya369@gmail.com}")
    private String fromEmail;

    @Value("${notification.mail.from-name:HealthCare Platform}")
    private String fromName;

    // ─────────────────────────────────────────────────────────────────────────
    // Core send method – NEVER propagates exceptions outside this method
    // ─────────────────────────────────────────────────────────────────────────

    public void sendHtmlEmail(EmailNotificationRequest request, String htmlContent) {
        boolean sent = false;
        String failureReason = null;

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(request.getTo());
            helper.setSubject(request.getSubject());
            helper.setText(htmlContent, true);
            helper.setFrom(fromEmail, fromName);

            mailSender.send(message);
            sent = true;
            log.info("HTML Email sent successfully to: {}", request.getTo());

        } catch (Exception e) {
            failureReason = e.getMessage();
            log.error("Failed to send HTML email to: {} – {}", request.getTo(), e.getMessage());
        }

        // Always try to persist the notification record, but never let DB failures propagate
        persistNotification(request, sent ? "SENT" : "FAILED", failureReason);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Generic simple email
    // ─────────────────────────────────────────────────────────────────────────

    public void sendSimpleEmail(EmailNotificationRequest request) {
        String html = "<html><body><p>" + request.getBody() + "</p></body></html>";
        sendHtmlEmail(request, html);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Doctor lifecycle events
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Sent when a new doctor completes registration.
     */
    public void sendDoctorRegistrationEmail(String recipientEmail, String recipientId,
                                            String doctorName, String specialization) {
        String html = renderTemplate("email/doctor-registration",
                ctx -> {
                    ctx.setVariable("doctorName", doctorName);
                    ctx.setVariable("specialization", specialization != null ? specialization : "");
                    ctx.setVariable("email", recipientEmail);
                });

        EmailNotificationRequest request = EmailNotificationRequest.builder()
                .to(recipientEmail)
                .recipientId(recipientId)
                .subject("Registration Received – Your Profile is Under Review")
                .body("Dear " + doctorName + ", your registration has been received and is pending admin review.")
                .notificationType("EMAIL")
                .build();

        sendHtmlEmail(request, html);
    }

    /**
     * Sent when an admin approves a doctor's account.
     */
    public void sendDoctorApprovalEmail(String recipientEmail, String recipientId,
                                        String doctorName, String specialization) {
        String html = renderTemplate("email/doctor-approved",
                ctx -> {
                    ctx.setVariable("doctorName", doctorName);
                    ctx.setVariable("specialization", specialization != null ? specialization : "");
                    ctx.setVariable("email", recipientEmail);
                });

        EmailNotificationRequest request = EmailNotificationRequest.builder()
                .to(recipientEmail)
                .recipientId(recipientId)
                .subject("Congratulations! Your Account Has Been Approved")
                .body("Dear " + doctorName + ", your doctor account has been approved.")
                .notificationType("EMAIL")
                .build();

        sendHtmlEmail(request, html);
    }

    /**
     * Sent when an admin rejects a doctor's registration.
     */
    public void sendDoctorRejectionEmail(String recipientEmail, String recipientId,
                                         String doctorName, String rejectionReason) {
        String effectiveReason = (rejectionReason != null && !rejectionReason.isBlank())
                ? rejectionReason
                : "Your application did not meet our current requirements.";

        String html = renderTemplate("email/doctor-rejected",
                ctx -> {
                    ctx.setVariable("doctorName", doctorName);
                    ctx.setVariable("email", recipientEmail);
                    ctx.setVariable("rejectionReason", effectiveReason);
                });

        EmailNotificationRequest request = EmailNotificationRequest.builder()
                .to(recipientEmail)
                .recipientId(recipientId)
                .subject("Application Update – HealthCare Platform")
                .body("Dear " + doctorName + ", we regret to inform you that your registration was not approved.")
                .notificationType("EMAIL")
                .build();

        sendHtmlEmail(request, html);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Prescription events
    // ─────────────────────────────────────────────────────────────────────────

    public void sendPrescriptionIssuedEmail(String recipientEmail, String recipientId,
                                            String doctorId, String patientName,
                                            String medications) {
        sendPrescriptionIssuedEmail(recipientEmail, recipientId, doctorId, patientName, "", "", "", medications, "", "");
    }

    /**
     * Full-detail prescription email (used by JSON body endpoint).
     */
    public void sendPrescriptionIssuedEmail(String recipientEmail, String recipientId,
                                            String doctorId, String patientName,
                                            String doctorName, String doctorSpecialization,
                                            String diagnosis, String medications,
                                            String dosage, String duration) {
        String effectiveDoctorName = (doctorName != null && !doctorName.isBlank()) ? doctorName : doctorId;
        String html = renderTemplate("email/prescription-issued",
                ctx -> {
                    ctx.setVariable("patientName", patientName != null ? patientName : "Patient");
                    ctx.setVariable("medications", medications);
                    ctx.setVariable("doctorName", effectiveDoctorName);
                    ctx.setVariable("doctorSpecialization", doctorSpecialization != null ? doctorSpecialization : "");
                    ctx.setVariable("diagnosis", diagnosis != null ? diagnosis : "");
                    ctx.setVariable("dosage", dosage != null ? dosage : "");
                    ctx.setVariable("duration", duration != null ? duration : "");
                });

        EmailNotificationRequest request = EmailNotificationRequest.builder()
                .to(recipientEmail)
                .recipientId(recipientId)
                .subject("New Prescription from " + effectiveDoctorName)
                .body("Dear " + patientName + ", a new prescription has been issued for you. Medications: " + medications)
                .notificationType("EMAIL")
                .build();

        sendHtmlEmail(request, html);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Appointment events
    // ─────────────────────────────────────────────────────────────────────────

    /** Backward-compatible overload (no patientName or specialization). */
    public void sendAppointmentConfirmationEmail(String recipientEmail, String recipientId,
                                                 String doctorName, String appointmentDate,
                                                 String appointmentTime) {
        sendAppointmentConfirmationEmail(recipientEmail, recipientId, "Patient", "", doctorName, appointmentDate, appointmentTime);
    }

    /** Full-detail overload — includes patientName and specialization. */
    public void sendAppointmentConfirmationEmail(String recipientEmail, String recipientId,
                                                 String patientName, String specialization,
                                                 String doctorName, String appointmentDate,
                                                 String appointmentTime) {
        String effectivePatient = (patientName != null && !patientName.isBlank()) ? patientName : "Patient";
        String html = renderTemplate("email/appointment-confirmation",
                ctx -> {
                    ctx.setVariable("patientName", effectivePatient);
                    ctx.setVariable("doctorName", doctorName);
                    ctx.setVariable("appointmentDate", appointmentDate);
                    ctx.setVariable("appointmentTime", appointmentTime);
                    ctx.setVariable("specialization", specialization != null ? specialization : "");
                });

        EmailNotificationRequest request = EmailNotificationRequest.builder()
                .to(recipientEmail)
                .recipientId(recipientId)
                .subject("Appointment Confirmed – " + doctorName + " on " + appointmentDate)
                .body("Dear " + effectivePatient + ", your appointment with " + doctorName
                        + " is confirmed for " + appointmentDate + " at " + appointmentTime)
                .notificationType("EMAIL")
                .build();

        sendHtmlEmail(request, html);
    }

    /** Backward-compatible overload. */
    public void sendCancellationEmail(String recipientEmail, String recipientId, String reason) {
        sendCancellationEmail(recipientEmail, recipientId, "Patient", "", "", "", reason);
    }

    /** Overload without patientName (existing controller uses this form). */
    public void sendCancellationEmail(String recipientEmail, String recipientId,
                                      String doctorName, String appointmentDate,
                                      String appointmentTime, String reason) {
        sendCancellationEmail(recipientEmail, recipientId, "Patient", doctorName, appointmentDate, appointmentTime, reason);
    }

    /** Full-detail overload — includes patientName. */
    public void sendCancellationEmail(String recipientEmail, String recipientId,
                                      String patientName, String doctorName,
                                      String appointmentDate, String appointmentTime,
                                      String reason) {
        String effectivePatient = (patientName != null && !patientName.isBlank()) ? patientName : "Patient";
        String html = renderTemplate("email/appointment-cancellation",
                ctx -> {
                    ctx.setVariable("patientName", effectivePatient);
                    ctx.setVariable("doctorName", doctorName);
                    ctx.setVariable("appointmentDate", appointmentDate);
                    ctx.setVariable("appointmentTime", appointmentTime);
                    ctx.setVariable("reason", reason != null ? reason : "Appointment cancelled");
                });

        EmailNotificationRequest request = EmailNotificationRequest.builder()
                .to(recipientEmail)
                .recipientId(recipientId)
                .subject("Appointment Cancelled – HealthCare Platform")
                .body("Dear " + effectivePatient + ", your appointment has been cancelled. Reason: " + reason)
                .notificationType("EMAIL")
                .build();

        sendHtmlEmail(request, html);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Payment events
    // ─────────────────────────────────────────────────────────────────────────

    public void sendPaymentConfirmationEmail(String recipientEmail, String recipientId,
                                             String transactionId, Double amount) {
        String html = renderTemplate("email/payment-confirmation",
                ctx -> {
                    ctx.setVariable("transactionId", transactionId);
                    ctx.setVariable("amount", String.format("%.2f", amount));
                    ctx.setVariable("paymentDate",
                            LocalDate.now().format(DateTimeFormatter.ofPattern("MMMM dd, yyyy")));
                    ctx.setVariable("paymentMethod", "Online Payment");
                });

        EmailNotificationRequest request = EmailNotificationRequest.builder()
                .to(recipientEmail)
                .recipientId(recipientId)
                .subject("Payment Confirmed – Rs. " + String.format("%.2f", amount))
                .body("Payment of Rs. " + amount + " confirmed. Transaction ID: " + transactionId)
                .notificationType("EMAIL")
                .build();

        sendHtmlEmail(request, html);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Private helpers
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Renders a Thymeleaf template. Falls back to a plain HTML error notice if the template
     * cannot be found (e.g. during local development before full build), so emails are never
     * blocked by a missing template.
     */
    private String renderTemplate(String templateName, java.util.function.Consumer<Context> contextSetup) {
        try {
            Context ctx = new Context();
            contextSetup.accept(ctx);
            return templateEngine.process(templateName, ctx);
        } catch (Exception e) {
            log.warn("Failed to render template '{}': {}. Falling back to plain HTML.", templateName, e.getMessage());
            return "<html><body><p>This is a notification from HealthCare Platform.</p></body></html>";
        }
    }

    /**
     * Saves a notification record to MongoDB. Errors are swallowed so DB issues
     * never cause an HTTP 500 for the caller.
     */
    private void persistNotification(EmailNotificationRequest request, String status, String failureReason) {
        try {
            Notification notification = Notification.builder()
                    .recipientId(request.getRecipientId())
                    .recipientEmail(request.getTo())
                    .notificationType("EMAIL")
                    .title(request.getSubject())
                    .message(request.getBody())
                    .subject(request.getSubject())
                    .status(status)
                    .isRead(false)
                    .failureReason(failureReason)
                    .createdAt(System.currentTimeMillis())
                    .sentAt("SENT".equals(status) ? System.currentTimeMillis() : null)
                    .build();

            notificationRepository.save(notification);
            log.debug("Notification record saved: {} [{}]", request.getTo(), status);
        } catch (Exception e) {
            // DB failure must NEVER propagate – log and continue
            log.warn("Failed to persist notification record for {} – {}", request.getTo(), e.getMessage());
        }
    }
}
